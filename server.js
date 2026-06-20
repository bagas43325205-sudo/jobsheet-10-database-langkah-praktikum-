const express = require('express');
const mongoose = require('mongoose');
const { Customer, Product, Order } = require('./models');

const app = express();
app.use(express.json());

// Hubungkan ke MongoDB
mongoose.connect('mongodb://localhost:27017/toko_online_db')
  .then(() => console.log('Terhubung ke MongoDB Toko Online'))
  .catch(err => console.error('Gagal terhubung ke MongoDB:', err));

// ========== ENDPOINT 1: Menambahkan pelanggan baru ==========
app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, address } = req.body;
    const customer = new Customer({ name, email, address });
    await customer.save();
    res.status(201).json({
      success: true,
      message: 'Pelanggan berhasil ditambahkan',
      data: customer
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ========== ENDPOINT 2: Menambahkan produk ==========
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, stock, category } = req.body;
    const product = new Product({ name, price, stock, category });
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ========== ENDPOINT 3: Membuat pesanan baru ==========
app.post('/api/orders', async (req, res) => {
  try {
    const { customerId, items } = req.body;

    // 1. Cek apakah customer ada
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });
    }

    // 2. Hitung total amount dan cek stok
    let totalAmount = 0;
    const orderItems = [];

    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Produk ${item.productId} tidak ditemukan` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Stok ${product.name} tidak mencukupi` });
      }

      // Kurangi stok
      product.stock -= item.quantity;
      await product.save();

      // Siapkan item pesanan
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        priceAtPurchase: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    // 3. Buat pesanan
    const order = new Order({
      customer: customerId,
      items: orderItems,
      totalAmount: totalAmount,
      status: 'pending'
    });

    await order.save();
    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ========== ENDPOINT 4: Mendapatkan detail pesanan (dengan populate) ==========
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('customer')               // ganti ID customer dengan data lengkap
      .populate('items.product');         // ganti ID product di setiap items dengan data lengkap

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ========== ENDPOINT 5: Mendapatkan semua pesanan dari seorang customer ==========
app.get('/api/customers/:customerId/orders', async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.params.customerId })
      .populate('items.product')
      .sort({ orderDate: -1 });   // terbaru di atas

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server berjalan di http://localhost:3000');
});
