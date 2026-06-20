const mongoose = require('mongoose');

// models/Customer.js
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: {
    street: String,
    city: String,
    postalCode: String
  },   // ← embedded one-to-one
  registeredAt: { type: Date, default: Date.now }
});

// models/Product.js
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  category: String
});

// models/Order.js
const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },   // ← reference one-to-many
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, required: true, min: 1 },
      priceAtPurchase: Number   // menyimpan harga saat beli (embedded di items)
    }
  ],   // ← reference many-to-many melalui array
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderDate: { type: Date, default: Date.now }
});

module.exports = {
  Customer: mongoose.model('Customer', customerSchema),
  Product: mongoose.model('Product', productSchema),
  Order: mongoose.model('Order', orderSchema)
};