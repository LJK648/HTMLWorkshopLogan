import React, { useState, useEffect } from 'react';

const ORDERS_STORAGE_KEY = 'vernball_orders';

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchText, setSearchText] = useState('');

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

    const filteredOrders = orders.filter(order =>
        order.id.toString().includes(searchText) ||
        order.customerId.toLowerCase().includes(searchText.toLowerCase())
    );

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'approved':
                return 'info';
            case 'rejected':
                return 'danger';
            case 'pending':
            default:
                return 'warning';
        }
    };

    return (
        <div>
            <header className="page-header">
                <div className="container">
                    <h1>Order History</h1>
                    <p>View and track all your orders.</p>
                </div>
            </header>

            <main className="container mt-5">
                <div className="row">
                    <div className="col-lg-8">
                        <h3 className="mb-4">Your Orders</h3>

                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by Order ID or Customer ID..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div className="alert alert-info">
                                {orders.length === 0 ? 'No orders yet.' : 'No orders match your search.'}
                            </div>
                        ) : (
                            <div>
                                {filteredOrders.map(order => (
                                    <div className="card mb-3 shadow-sm" key={order.id}>
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5 className="mb-0">Order #{order.id}</h5>
                                                <small className="text-muted">Customer: {order.customerId}</small>
                                            </div>
                                            <span className={`badge bg-${getStatusBadgeColor(order.status)}`}>
                                                {(order.status || 'pending').toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <p><strong>Items:</strong> {order.items?.length || 0}</p>
                                                    <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="col-md-6 text-md-end">
                                                    <p><strong>Total:</strong> <span className="h5 text-primary">${order.total?.toFixed(2) || '0.00'}</span></p>
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                                            >
                                                {selectedOrder?.id === order.id ? 'Hide Details' : 'View Details'}
                                            </button>
                                        </div>

                                        {selectedOrder?.id === order.id && (
                                            <div className="card-footer bg-light">
                                                <h6>Order Details</h6>
                                                {order.items && order.items.length > 0 ? (
                                                    <ul className="list-unstyled">
                                                        {order.items.map((item, idx) => (
                                                            <li key={idx} className="pb-2">
                                                                <span className="me-3">{item.name || `Item ${idx + 1}`}</span>
                                                                <span className="text-muted">Qty: {item.quantity || 1}</span>
                                                                <span className="float-end">${item.price?.toFixed(2) || '0.00'}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-muted">No items in this order.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="col-lg-4">
                        <div className="card shadow-sm">
                            <div className="card-header bg-light">
                                <h5 className="mb-0">Order Statistics</h5>
                            </div>
                            <div className="card-body">
                                <p className="mb-2">
                                    <strong>Total Orders:</strong> {orders.length}
                                </p>
                                <p className="mb-2">
                                    <strong>Pending:</strong> {orders.filter(o => o.status === 'pending' || !o.status).length}
                                </p>
                                <p className="mb-2">
                                    <strong>Approved:</strong> {orders.filter(o => o.status === 'approved').length}
                                </p>
                                <p className="mb-2">
                                    <strong>Completed:</strong> {orders.filter(o => o.status === 'completed').length}
                                </p>
                                <p className="mb-2">
                                    <strong>Rejected:</strong> {orders.filter(o => o.status === 'rejected').length}
                                </p>
                                <hr />
                                <p className="mb-0">
                                    <strong>Total Revenue:</strong> <span className="text-success h6">${orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrderHistory;
