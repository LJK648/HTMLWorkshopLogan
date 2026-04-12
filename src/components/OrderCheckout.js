import React, { useState } from 'react';

const ORDERS_STORAGE_KEY = 'vernball_orders';

const OrderCheckout = () => {
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [items, setItems] = useState([{ name: '', quantity: 1, price: 0 }]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('danger');

    const API = process.env.NODE_ENV === 'production'
        ? ''
        : 'http://localhost:5000';

    const showMessage = (msg, type = 'danger') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const addItem = () => {
        setItems([...items, { name: '', quantity: 1, price: 0 }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!customerName.trim() || !customerEmail.trim()) {
            showMessage('Please fill in customer information', 'danger');
            return;
        }

        if (items.some(item => !item.name.trim() || item.quantity <= 0 || item.price <= 0)) {
            showMessage('Please fill in all item details', 'danger');
            return;
        }

        const orderData = {
            customerId: customerEmail,
            customerName: customerName.trim(),
            items: items.map(item => ({
                name: item.name.trim(),
                quantity: parseInt(item.quantity),
                price: parseFloat(item.price)
            })),
            total: calculateTotal(),
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        setLoading(true);

        try {
            // Submit to backend
            const response = await fetch(`${API}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                throw new Error('Failed to submit order');
            }

            // Also save to localStorage
            const json = localStorage.getItem(ORDERS_STORAGE_KEY);
            let orders = [];
            if (json) {
                try {
                    orders = JSON.parse(json);
                } catch (error) {
                    console.error('Error parsing orders', error);
                }
            }

            const newOrder = {
                id: Date.now(),
                ...orderData
            };

            orders.push(newOrder);
            localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

            showMessage('Order submitted successfully! Check your email for confirmation.', 'success');
            
            // Reset form
            setCustomerName('');
            setCustomerEmail('');
            setItems([{ name: '', quantity: 1, price: 0 }]);
        } catch (error) {
            console.error('Error submitting order:', error);
            showMessage('Error submitting order. Please try again.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <header className="page-header">
                <div className="container">
                    <h1>Order Checkout</h1>
                    <p>Complete your order and proceed to payment.</p>
                </div>
            </header>

            <main className="container mt-5 mb-5">
                {message && (
                    <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
                        {message}
                        <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                    </div>
                )}

                <div className="row">
                    <div className="col-lg-6">
                        <h3 className="mb-4">Customer Information</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Full Name *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="form-label">Email Address *</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <h3 className="mb-4">Order Items</h3>

                            {items.map((item, index) => (
                                <div className="card mb-3" key={index}>
                                    <div className="card-body">
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Item Name *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                    placeholder="e.g., Merchandise, Sponsorship"
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Quantity *</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Price *</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.price}
                                                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => removeItem(index)}
                                            >
                                                Remove Item
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                className="btn btn-outline-secondary mb-4"
                                onClick={addItem}
                            >
                                + Add Another Item
                            </button>

                            <div className="d-grid gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Submit Order'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="col-lg-6">
                        <div className="card shadow-sm">
                            <div className="card-header bg-light">
                                <h5 className="mb-0">Order Summary</h5>
                            </div>
                            <div className="card-body">
                                <h6 className="mb-3">Items:</h6>
                                {items.length === 0 ? (
                                    <p className="text-muted">No items added yet.</p>
                                ) : (
                                    <>
                                        <table className="table table-sm">
                                            <tbody>
                                                {items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.name || `Item ${idx + 1}`}</td>
                                                        <td className="text-center">x{item.quantity}</td>
                                                        <td className="text-end">${(item.quantity * item.price).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <hr />
                                        <h5 className="text-end">Total: <span className="text-primary">${calculateTotal().toFixed(2)}</span></h5>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrderCheckout;
