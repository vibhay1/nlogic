
import mongoose from 'mongoose'
const variantsSchema = mongoose.Schema({
    itemID: { type: String, unique: true },
    itemDescription: { type: String },
    packaging: { type: String }
}, { _id: false });

const productSchema = mongoose.Schema({
    docId: { type: String },
    data: {
        name: { type: String },
        description: { type: String },
        productId: { type: String, unique: true },
        manufacturerName: { type: String },
        variants: [variantsSchema],
        options: []
    }
}, {
    timestamps: true
});
export default mongoose.model('product', productSchema);
