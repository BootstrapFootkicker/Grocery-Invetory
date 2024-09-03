const pool = require("../config/db");

// Render the form to add a new product category
exports.categoryForm = async (req, res) => {
  try {
    res.render("categoryForm", { title: "Add Product Category" });
  } catch (err) {
    console.error("Error rendering categoryForm:", err);
    res.status(500).send("Server Error");
  }
};

// Get the category ID by category name
exports.getCategoryIdByName = async (categoryName) => {
  try {
    const result = await pool.query(
      "SELECT categoryid FROM categories WHERE categoryname = $1",
      [categoryName],
    );
    return result.rows[0]?.categoryid || null;
  } catch (err) {
    console.error("Error fetching category ID from database:", err);
    throw err;
  }
};

// Add a new category to the database
exports.addCategoryToDB = async (req, res) => {
  const { categoryName } = req.body;
  console.log("Received categoryName:", categoryName);
  try {
    const result = await pool.query(
      "INSERT INTO categories (categoryname) VALUES ($1) RETURNING *",
      [categoryName],
    );
    console.log("Inserted category:", result.rows[0]);
    res.redirect("/products");
  } catch (err) {
    console.error("Error adding category to database:", err);
    res.status(500).send("Server Error");
  }
};

exports.removeCategoryFromDB = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const miscCategoryId = await exports.getCategoryIdByName("MISC");

    await pool.query(
      "UPDATE products SET categoryid = $1 WHERE categoryid = $2",
      [miscCategoryId, categoryId],
    );

    await pool.query("DELETE FROM categories WHERE categoryid = $1", [
      categoryId,
    ]);

    res.redirect("/products");
  } catch (err) {
    console.error("Error deleting category from database:", err);
    res.status(500).send("Server Error");
  }
};

// Get all categories from the database
exports.getAllCategories = async () => {
  try {
    const result = await pool.query("SELECT * FROM categories");
    return result.rows;
  } catch (err) {
    console.error("Error fetching categories from database:", err);
    throw err;
  }
};

// Fetch and render products by category
exports.categoryProducts = async (req, res) => {
  const categoryName = req.params.categoryName;

  try {
    const categoryId = await exports.getCategoryIdByName(categoryName);

    if (!categoryId) {
      return res.status(404).send(`${categoryName} category not found`);
    }

    const products = await pool.query(
      "SELECT * FROM products WHERE categoryid = $1",
      [categoryId],
    );

    const categories = await exports.getAllCategories();

    res.render("products", {
      title: `${categoryName} Products`,
      data: products.rows,
      categories: categories,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
