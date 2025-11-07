import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Package, CreditCard as Edit, Trash2, X } from 'lucide-react';
import { ArticuloInventario } from '../types';

export default function Inventario() {
  const [inventario, setInventario] = useState<ArticuloInventario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedArticulo, setSelectedArticulo] = useState<ArticuloInventario | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cantidad: '',
    nivel_reorden: '',
    precio: ''
  });

  useEffect(() => {
    fetchInventario();
  }, []);

  const fetchInventario = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/inventory/articulos-inventario/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      const data = await response.json();
      setInventario(data.results);
    } catch (error) {
      console.error('Error al obtener el inventario:', error);
    }
  };

  const filteredInventario = inventario.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.descripcion && item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const itemsBajoStock = filteredInventario.filter(item => item.cantidad <= item.nivel_reorden);
  const itemsNormalStock = filteredInventario.filter(item => item.cantidad > item.nivel_reorden);

  const handleOpenModal = (articulo?: ArticuloInventario) => {
    if (articulo) {
      setSelectedArticulo(articulo);
      setFormData({
        nombre: articulo.nombre,
        descripcion: articulo.descripcion || '',
        cantidad: articulo.cantidad.toString(),
        nivel_reorden: articulo.nivel_reorden.toString(),
        precio: articulo.precio?.toString() || ''
      });
    } else {
      setSelectedArticulo(null);
      setFormData({
        nombre: '',
        descripcion: '',
        cantidad: '',
        nivel_reorden: '',
        precio: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedArticulo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedArticulo) {
      const isConfirmed = window.confirm('¿Está seguro de que desea actualizar este artículo?');
      if (!isConfirmed) {
        return;
      }
    }

    const url = selectedArticulo
      ? `${import.meta.env.VITE_API_URL}/inventory/articulos-inventario/${selectedArticulo.id}/`
      : `${import.meta.env.VITE_API_URL}/inventory/articulos-inventario/`;
    const method = selectedArticulo ? 'PUT' : 'POST';

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          cantidad: parseInt(formData.cantidad),
          nivel_reorden: parseInt(formData.nivel_reorden),
          precio: formData.precio ? parseFloat(formData.precio) : null,
        }),
      });

      if (response.ok) {
        fetchInventario();
        handleCloseModal();
      } else {
        console.error('Error saving articulo:', await response.json());
      }
    } catch (error) {
      console.error('Error saving articulo:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este artículo?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/inventory/articulos-inventario/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${token}`,
          },
        });

        if (response.ok) {
          fetchInventario();
        } else {
          console.error('Error deleting articulo:', await response.json());
        }
      } catch (error) {
        console.error('Error deleting articulo:', error);
      }
    }
  };

  const getStockStatus = (cantidad: number, nivel_reorden: number) => {
    if (cantidad === 0) {
      return { label: 'Sin Stock', color: 'bg-red-100 text-red-700 border-red-200' };
    } else if (cantidad <= nivel_reorden) {
      return { label: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    } else {
      return { label: 'Stock Normal', color: 'bg-green-100 text-green-700 border-green-200' };
    }
  };

  const InventarioCard = ({ item }: { item: ArticuloInventario }) => {
    const status = getStockStatus(item.cantidad, item.nivel_reorden);
    const stockPercentage = (item.cantidad / (item.nivel_reorden * 2)) * 100;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-3 bg-teal-50 rounded-lg">
              <Package className="text-teal-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{item.nombre}</h3>
              {item.descripcion && (
                <p className="text-sm text-gray-600 mt-1">{item.descripcion}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenModal(item)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit size={18} className="text-gray-600" />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 size={18} className="text-red-600" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Cantidad en stock</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full transition-all ${
                  item.cantidad === 0
                    ? 'bg-red-500'
                    : item.cantidad <= item.nivel_reorden
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="font-semibold text-gray-800">{item.cantidad} unidades</span>
              <span className="text-gray-500">Mín: {item.nivel_reorden}</span>
            </div>
          </div>

          {item.precio != null && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Precio unitario</span>
                <span className="text-lg font-bold text-gray-800">${parseFloat(item.precio.toString()).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">Valor total en stock</span>
                <span className="text-sm font-semibold text-teal-600">
                  ${(item.cantidad * parseFloat(item.precio.toString())).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-[2000px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
          <p className="text-gray-600 mt-1">Gestión de medicamentos y suministros</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <Plus size={20} />
          Nuevo Artículo
        </button>
      </div>

      {itemsBajoStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800">Alerta de Stock Bajo</h3>
              <p className="text-yellow-700 text-sm mt-1">
                {itemsBajoStock.length} artículo{itemsBajoStock.length > 1 ? 's necesitan' : ' necesita'} reabastecimiento
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {itemsBajoStock.map(item => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-yellow-300 rounded-lg text-xs text-yellow-800"
                  >
                    {item.nombre}: {item.cantidad} unidades
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar artículos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-700">Total Artículos</p>
              <p className="text-2xl font-bold text-teal-800 mt-1">{inventario.length}</p>
            </div>
            <Package className="text-teal-600" size={32} />
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Stock Bajo</p>
              <p className="text-2xl font-bold text-yellow-800 mt-1">{itemsBajoStock.length}</p>
            </div>
            <AlertTriangle className="text-yellow-600" size={32} />
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Valor Total</p>
              <p className="text-2xl font-bold text-green-800 mt-1">
                ${inventario
                  .reduce((acc, item) => acc + (item.cantidad * (item.precio || 0)), 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="text-green-600 text-xl font-bold">$</div>
          </div>
        </div>
      </div>

      {itemsBajoStock.length > 0 && (
        <>
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-yellow-600" size={20} />
              Artículos con Stock Bajo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemsBajoStock.map(item => (
                <InventarioCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </>
      )}

      {itemsNormalStock.length > 0 && (
        <>
          <div className={`${itemsBajoStock.length > 0 ? 'border-t border-gray-200 pt-6' : ''}`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Artículos con Stock Normal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemsNormalStock.map(item => (
                <InventarioCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </>
      )}

      {filteredInventario.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-500">No se encontraron artículos</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedArticulo ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel Reorden <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.nivel_reorden}
                    onChange={(e) => setFormData({ ...formData, nivel_reorden: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Unitario
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  {selectedArticulo ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
