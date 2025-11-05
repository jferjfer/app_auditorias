import React from 'react';

let confirmFn = null;

export const confirm = (msg) => {
  return new Promise((resolve) => {
    confirmFn?.(msg, resolve);
  });
};

export default function ConfirmModal() {
  const [show, setShow] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [resolver, setResolver] = React.useState(null);

  React.useEffect(() => {
    confirmFn = (msg, resolve) => {
      setMessage(msg);
      setShow(true);
      setResolver(() => resolve);
    };
  }, []);

  const handleConfirm = () => {
    resolver?.(true);
    setShow(false);
  };

  const handleCancel = () => {
    resolver?.(false);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{borderRadius: '16px', border: 'none', overflow: 'hidden'}}>
          <div className="modal-header" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none'}}>
            <h5 className="modal-title">Confirmar</h5>
          </div>
          <div className="modal-body" style={{padding: '30px', fontSize: '16px'}}>
            {message}
          </div>
          <div className="modal-footer" style={{border: 'none', padding: '20px'}}>
            <button className="btn btn-secondary" onClick={handleCancel} style={{borderRadius: '8px', padding: '10px 24px'}}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleConfirm} style={{borderRadius: '8px', padding: '10px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
