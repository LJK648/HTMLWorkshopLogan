import React, { useState, useEffect } from 'react';

const ORDERS_STORAGE_KEY = 'vernball_orders';

const OrderApprovalPage = () => {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('danger');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = () => {
        const json = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (json) {
            try {
                const saved = JSON.parse(json);
                setOrders(Array.isArray(saved) ? saved : []);
            } catch (error) {
                console.error('Error reading orders', error);
            }
        }
    };

    const saveOrders = (newOrders) => {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(newOrders));
        setOrders(newOrders);
    };

    const updateOrderStatus = (orderId, newStatus) => {
        const updatedOrders = orders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
        );
        saveOrders(updatedOrders);
        showMessage(`Order ${orderId} marked as ${newStatus}`, 'success');
    };

    const deleteOrder = (orderId) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        const newOrders = orders.filter(order => order.id !== orderId);
        saveOrders(newOrders);
        showMessage('Order deleted', 'success');
    };

    const showMessage = (msg, type = 'danger') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(order => order.status === filter);

    return (
        <div>
            <header className="page-header">
                <div className="container">
                    <h1>Order Approval Management</h1>
                    <p>Review and manage all customer orders.</p>
                </div>
            </header>

            <main className="container mt-5">
                {message && (
                    <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
                        {message}
                        <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                    </div>
                )}

                <div className="mb-4">
                    <h3>Filter Orders</h3>
                    <div className="btn-group" role="group">
                        {['all', 'pending', 'approved', 'rejected', 'completed'].map(status => (
                            <button
                                key={status}
                                type="button"
                                className={`btn ${filter === status ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setFilter(status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="alert alert-info">No orders found.</div>
                ) : (
                    <div className="row">
                        {filteredOrders.map(order => (
                            <div className="col-md-6 col-lg-4 mb-4" key={order.id}>
                                <div className="card shadow-sm">
                                    <div className="card-header bg-light">
                                        <h5 className="mb-0">Order #{order.id}</h5>
                                        <small className="text-muted">Customer: {order.customerId}</small>
                                    </div>
                                    <div className="card-body">
                                        <p><strong>Items:</strong> {order.items?.length || 0}</p>
                                        <p><strong>Total:</strong> ${order.total?.toFixed(2) || '0.00'}</p>
                                        <p>
                                            <strong>Status:</strong>{' '}
                                            <span className={`badge bg-${
                                                order.status === 'approved' ? 'success' :
                                                order.status === 'rejected' ? 'danger' :
                                                order.status === 'completed' ? 'info' :
                                                'warning'
                                            }`}>
                                                {order.status || 'pending'}
                                            </span>
                                        </p>
                                        <p><small className="text-muted">Created: {new Date(order.createdAt).toLocaleDateString()}</small></p>
                                    </div>
                                    <div className="card-footer">
                                        {order.status === 'pending' && (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-success me-2"
                                                    onClick={() => updateOrderStatus(order.id, 'approved')}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => updateOrderStatus(order.id, 'rejected')}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'approved' && (
                                            <button
                                                className="btn btn-sm btn-info"
                                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                            >
                                                Mark Complete
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-sm btn-outline-danger ms-2"
                                            onClick={() => deleteOrder(order.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default OrderApprovalPage;
