import React from 'react';
import { X, CheckCircle, AlertCircle, Trash2, Heart } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-12 h-12 text-yellow-400" />;
      case 'confirm':
        return <Trash2 className="w-12 h-12 text-red-400" />;
      default:
        return <Heart className="w-12 h-12 text-red-400 fill-current" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          border: 'border-green-700',
          bg: 'from-green-900/50 to-green-800/50',
          button: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
        };
      case 'error':
        return {
          border: 'border-red-700',
          bg: 'from-red-900/50 to-red-800/50',
          button: 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
        };
      case 'warning':
        return {
          border: 'border-yellow-700',
          bg: 'from-yellow-900/50 to-yellow-800/50',
          button: 'from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800'
        };
      case 'confirm':
        return {
          border: 'border-red-700',
          bg: 'from-red-900/50 to-red-800/50',
          button: 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
        };
      default:
        return {
          border: 'border-gray-700',
          bg: 'from-gray-900/50 to-gray-800/50',
          button: 'from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-gradient-to-br ${colors.bg} rounded-2xl shadow-2xl border ${colors.border} max-w-md w-full transform transition-all duration-300 scale-100`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <p className="text-gray-300 text-lg leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-700">
          {type === 'confirm' && onConfirm ? (
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 bg-gradient-to-r ${colors.button} text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105`}
              >
                {confirmText}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className={`w-full bg-gradient-to-r ${colors.button} text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};