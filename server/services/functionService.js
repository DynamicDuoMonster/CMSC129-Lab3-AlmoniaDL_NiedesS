/**
 * functionService.js
 * Executes the actual database operations when the AI requests a tool call.
 * The AI decides WHAT to do; this file does the actual work via Mongoose models.
 *
 * IMPORTANT: The AI never touches the DB directly. It calls a tool name + args,
 * and this service translates that into a safe, validated Mongoose query.
 */

const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Shoe model — uses the existing shoeModel.js schema
// We use a lazy getter so this file doesn't blow up if required before DB connects
// ---------------------------------------------------------------------------
const getShoeModel = () => {
  const { PrimaryShoe } = require('../models/shoeModel');
  return PrimaryShoe;
};

// ---------------------------------------------------------------------------
// HELPER: Build a Mongoose filter object from AI-provided filter params
// Fields aligned to shoeModel.js: shoe_name, brand, color, price, category, gender
// ---------------------------------------------------------------------------
const buildFilter = (filterParams = {}) => {
  const query = { isDeleted: { $ne: true } }; // never return soft-deleted docs

  if (filterParams.brand)    query.brand    = new RegExp(filterParams.brand, 'i');
  if (filterParams.category) query.category = new RegExp(filterParams.category, 'i');
  if (filterParams.gender)   query.gender   = new RegExp(filterParams.gender, 'i');
  if (filterParams.color)    query.color    = { $in: [new RegExp(filterParams.color, 'i')] };

  if (filterParams.minPrice !== undefined || filterParams.maxPrice !== undefined) {
    query.price = {};
    if (filterParams.minPrice !== undefined) query.price.$gte = filterParams.minPrice;
    if (filterParams.maxPrice !== undefined) query.price.$lte = filterParams.maxPrice;
  }

  return query;
};

// ---------------------------------------------------------------------------
// HELPER: Format a Mongoose doc into a clean object for AI consumption
// ---------------------------------------------------------------------------
const formatShoe = (doc) => ({
  id:        doc._id ? doc._id.toString() : doc.id,
  shoe_name: doc.shoe_name,
  brand:     doc.brand,
  color:     Array.isArray(doc.color) ? doc.color.join(', ') : doc.color,
  price:     doc.price != null ? `$${doc.price}` : 'N/A',
  rawPrice:  doc.price,
  category:  doc.category,
  gender:    doc.gender,
  imageUrl:  doc.imageUrl && doc.imageUrl.length > 0 ? doc.imageUrl[0] : null,
});

// ---------------------------------------------------------------------------
// TOOL EXECUTORS
// ---------------------------------------------------------------------------

/**
 * getAllShoes — fetch with optional filters, sorting, limit
 */
const getAllShoes = async (args) => {
  const Shoe = getShoeModel();
  const filter = buildFilter(args);

  let q = Shoe.find(filter);

  if (args.sortBy) {
    const dir = args.sortOrder === 'desc' ? -1 : 1;
    q = q.sort({ [args.sortBy]: dir });
  }

  q = q.limit(args.limit || 20);

  const results = await q.lean();
  return {
    count: results.length,
    shoes: results.map(formatShoe)
  };
};

/**
 * getShoeById — single record by MongoDB _id
 */
const getShoeById = async ({ id }) => {
  const Shoe = getShoeModel();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid shoe ID: ${id}`);
  }
  const shoe = await Shoe.findOne({ _id: id, isDeleted: { $ne: true } }).lean();
  if (!shoe) throw new Error(`No shoe found with ID: ${id}`);
  return formatShoe(shoe);
};

/**
 * searchShoes — regex search across shoe_name and brand
 */
const searchShoes = async ({ query }) => {
  const Shoe = getShoeModel();
  const regex = new RegExp(query, 'i');
  const results = await Shoe.find({
    isDeleted: { $ne: true },
    $or: [
      { shoe_name: regex },
      { brand: regex },
      { category: regex }
    ]
  }).limit(20).lean();

  return {
    count: results.length,
    shoes: results.map(formatShoe)
  };
};

/**
 * getInventorySummary — aggregate stats across the whole collection
 */
const getInventorySummary = async () => {
  const Shoe = getShoeModel();
  const activeFilter = { isDeleted: { $ne: true } };

  const [totalCount, brandBreakdown, categoryBreakdown, genderBreakdown, priceAgg] =
    await Promise.all([
      Shoe.countDocuments(activeFilter),
      Shoe.aggregate([
        { $match: activeFilter },
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Shoe.aggregate([
        { $match: activeFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Shoe.aggregate([
        { $match: activeFilter },
        { $group: { _id: '$gender', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Shoe.aggregate([
        { $match: activeFilter },
        {
          $group: {
            _id:      null,
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
          }
        }
      ])
    ]);

  const stats = priceAgg[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0 };

  return {
    totalItems:   totalCount,
    averagePrice: `$${(stats.avgPrice || 0).toFixed(2)}`,
    lowestPrice:  `$${(stats.minPrice || 0).toFixed(2)}`,
    highestPrice: `$${(stats.maxPrice || 0).toFixed(2)}`,
    byBrand:      brandBreakdown.map((b) => ({ brand: b._id, count: b.count })),
    byCategory:   categoryBreakdown.map((c) => ({ category: c._id, count: c.count })),
    byGender:     genderBreakdown.map((g) => ({ gender: g._id, count: g.count })),
  };
};

/**
 * createShoe — insert a new document
 */
const createShoe = async (args) => {
  const Shoe = getShoeModel();

  const shoe = new Shoe({
    shoe_name: args.shoe_name,
    brand:     args.brand,
    color:     Array.isArray(args.color) ? args.color : [args.color],
    price:     args.price,
    imageUrl:  args.imageUrl ? [args.imageUrl] : [],
    category:  args.category  || 'Lifestyle',
    gender:    args.gender    || 'Unisex',
  });

  const saved = await shoe.save();
  return {
    message: 'Shoe added successfully',
    shoe: formatShoe(saved.toObject())
  };
};

/**
 * updateShoe — update a single shoe by ID
 */
const updateShoe = async ({ id, updates }) => {
  const Shoe = getShoeModel();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid shoe ID: ${id}`);
  }

  // Ensure color stays an array if provided
  if (updates.color && !Array.isArray(updates.color)) {
    updates.color = [updates.color];
  }

  const updated = await Shoe.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) throw new Error(`No shoe found with ID: ${id}`);

  return {
    message: 'Shoe updated successfully',
    shoe: formatShoe(updated)
  };
};

/**
 * bulkUpdateShoes — update multiple docs matching a filter
 */
const bulkUpdateShoes = async ({ filter, updates }) => {
  const Shoe = getShoeModel();
  const mongoFilter = buildFilter(filter);
  const mongoUpdate = {};

  if (updates.priceMultiplier) {
    mongoUpdate.$mul = { price: updates.priceMultiplier };
  } else if (updates.price !== undefined) {
    mongoUpdate.$set = { ...mongoUpdate.$set, price: updates.price };
  }

  if (updates.category) mongoUpdate.$set = { ...mongoUpdate.$set, category: updates.category };
  if (updates.gender)   mongoUpdate.$set = { ...mongoUpdate.$set, gender:   updates.gender   };

  const result = await Shoe.updateMany(mongoFilter, mongoUpdate);
  const sample = await Shoe.find(mongoFilter).limit(5).lean();

  return {
    message:       `Updated ${result.modifiedCount} shoe(s)`,
    modifiedCount: result.modifiedCount,
    sample:        sample.map(formatShoe)
  };
};

/**
 * findShoesByName — search shoes by name fragment for name→ID resolution
 * Used by aiService before destructive single-shoe operations.
 */
const findShoesByName = async ({ name }) => {
  const Shoe = getShoeModel();
  const regex = new RegExp(name, 'i');
  const results = await Shoe.find({
    isDeleted: { $ne: true },
    shoe_name: regex
  }).limit(10).lean();

  return {
    count: results.length,
    shoes: results.map(formatShoe)
  };
};

/**
 * deleteShoe — soft-delete one shoe by ID (sets isDeleted: true, reversible)
 */
const deleteShoe = async ({ id }) => {
  const Shoe = getShoeModel();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid shoe ID: ${id}`);
  }

  const shoe = await Shoe.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { $set: { isDeleted: true } },
    { new: true }
  ).lean();

  if (!shoe) throw new Error(`No shoe found with ID: ${id}`);

  return {
    message: 'Shoe moved to trash successfully',
    shoe: formatShoe(shoe)
  };
};

/**
 * hardDeleteShoe — permanently delete one shoe by ID (irreversible)
 */
const hardDeleteShoe = async ({ id }) => {
  const Shoe = getShoeModel();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid shoe ID: ${id}`);
  }

  const deleted = await Shoe.findOneAndDelete({
    _id: id,
    isDeleted: { $ne: true }
  }).lean();

  if (!deleted) throw new Error(`No shoe found with ID: ${id}`);

  return {
    message: 'Shoe permanently deleted',
    deleted: formatShoe(deleted)
  };
};

/**
 * bulkDeleteShoes — delete multiple shoes by filter or ID list
 */
const bulkDeleteShoes = async ({ filter, ids }) => {
  const Shoe = getShoeModel();
  let mongoFilter = { isDeleted: { $ne: true } };

  if (ids && ids.length > 0) {
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    mongoFilter._id = { $in: validIds };
  } else if (filter && Object.keys(filter).length > 0) {
    mongoFilter = buildFilter(filter);
  } else {
    throw new Error('Must provide either filter criteria or specific IDs to delete');
  }

  const toDelete = await Shoe.find(mongoFilter).limit(50).lean();
  const result   = await Shoe.deleteMany(mongoFilter);

  return {
    message:      `Deleted ${result.deletedCount} shoe(s)`,
    deletedCount: result.deletedCount,
    deleted:      toDelete.slice(0, 10).map(formatShoe)
  };
};

// ---------------------------------------------------------------------------
// DISPATCHER: routes AI tool call names → executor functions
// ---------------------------------------------------------------------------
const TOOL_MAP = {
  getAllShoes,
  getShoeById,
  searchShoes,
  findShoesByName,
  getInventorySummary,
  createShoe,
  updateShoe,
  bulkUpdateShoes,
  deleteShoe,
  hardDeleteShoe,
  bulkDeleteShoes
};

const executeTool = async (toolName, args) => {
  const fn = TOOL_MAP[toolName];
  if (!fn) throw new Error(`Unknown tool: ${toolName}`);
  return fn(args);
};

module.exports = { executeTool };