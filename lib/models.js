import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema(
  {
    street: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    city: { type: String, default: '' },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'operateur', 'livreur', 'client'], default: 'client' },
    active: { type: Boolean, default: true },
    phone: { type: String, default: '' },
    address: { type: AddressSchema, default: () => ({}) },
    points: { type: Number, default: 0 },
    totpEnabled: { type: Boolean, default: false },
    totpSecret: { type: String, default: '' },
  },
  { timestamps: true }
);

const OrderItemSchema = new mongoose.Schema(
  {
    sku: String,
    name: String,
    category: String,
    qty: Number,
    unitPrice: Number,
    lineTotal: Number,
    needsIron: Boolean,
    needsFold: Boolean,
    isHV: Boolean,
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    number: { type: String, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientName: String,
    clientEmail: String,
    deliveryAddress: { type: AddressSchema, default: () => ({}) },
    items: [OrderItemSchema],
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'ready', 'delivered', 'cancelled'],
      default: 'pending',
    },
    notes: String,
    express: { type: Boolean, default: false },
    pickupDate: Date,
    deliveryNumber: String,
    invoiceNumber: String,
    cancelledAt: Date,
    cancelledBy: String,
  },
  { timestamps: true }
);

const TaskSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    orderNumber: String,
    type: { type: String, enum: ['lavage', 'sechage', 'repassage', 'pliage'], required: true },
    label: String,
    status: { type: String, enum: ['todo', 'doing', 'done'], default: 'todo' },
    machineHint: String,
    weightKg: Number,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const DeliverySchema = new mongoose.Schema(
  {
    number: { type: String, unique: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    orderNumber: String,
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clientName: String,
    address: { type: AddressSchema, default: () => ({}) },
    status: { type: String, enum: ['planned', 'in_transit', 'delivered', 'cancelled'], default: 'planned' },
    scheduledDate: Date,
    deliveredAt: Date,
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
  },
  { timestamps: true }
);

const GarmentSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientName: String,
    type: String,
    label: String,
    maxWashes: { type: Number, default: 50 },
    washCount: { type: Number, default: 0 },
    status: { type: String, enum: ['ok', 'attention', 'critique', 'hors_service'], default: 'ok' },
    notes: String,
    retiredAt: Date,
    retiredReason: String,
  },
  { timestamps: true }
);

const MessageSchema = new mongoose.Schema(
  {
    fromId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fromName: String,
    toRole: { type: String, default: 'staff' },
    body: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const InvoiceSchema = new mongoose.Schema(
  {
    number: { type: String, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clientName: String,
    clientEmail: String,
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    orderNumber: String,
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    items: [OrderItemSchema],
    address: { type: AddressSchema, default: () => ({}) },
    total: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'sent', 'paid', 'cancelled'], default: 'sent' },
    period: String,
    notes: String,
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
export const Delivery = mongoose.models.Delivery || mongoose.model('Delivery', DeliverySchema);
export const Garment = mongoose.models.Garment || mongoose.model('Garment', GarmentSchema);
export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
