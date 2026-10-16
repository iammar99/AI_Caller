require("dotenv").config();
const mongoose = require("mongoose");
const MenuItem = require("./models/MenuItem");

const menu = [
  // Burgers
  { name: "Zinger Burger", category: "Burgers", price: 550, available: true, description: "Crispy fried chicken fillet with lettuce and mayo sauce" },
  { name: "Beef Smash Burger", category: "Burgers", price: 650, available: true, description: "Double beef patty, cheddar, pickles, house sauce" },
  { name: "Chicken Cheese Burger", category: "Burgers", price: 480, available: true, description: "Grilled chicken patty with melted cheese" },
  { name: "Mighty Double Zinger", category: "Burgers", price: 790, available: false, description: "Two zinger fillets, double cheese (sold out today)" },

  // Sides
  { name: "Fries", category: "Sides", price: 250, available: true, description: "Golden salted fries" },
  { name: "Masala Fries", category: "Sides", price: 300, available: true, description: "Fries tossed in spicy masala" },
  { name: "Chicken Nuggets (6 pcs)", category: "Sides", price: 350, available: true, description: "Crispy nuggets with dip" },
  { name: "Onion Rings", category: "Sides", price: 280, available: true, description: "Beer-battered onion rings" },

  // Pizza
  { name: "Chicken Tikka Pizza (Medium)", category: "Pizza", price: 1150, available: true, description: "Tikka chicken, onions, capsicum, mozzarella" },
  { name: "Pepperoni Pizza (Medium)", category: "Pizza", price: 1250, available: true, description: "Beef pepperoni with extra cheese" },

  // Drinks
  { name: "Large Coke", category: "Drinks", price: 180, available: true, description: "500ml chilled Coca-Cola" },
  { name: "Regular Coke", category: "Drinks", price: 120, available: true, description: "345ml chilled Coca-Cola" },
  { name: "Sprite 1.5L", category: "Drinks", price: 260, available: true, description: "Family size Sprite" },
  { name: "Mint Margarita", category: "Drinks", price: 220, available: true, description: "Fresh mint and lemon cooler" },

  // Desserts
  { name: "Chocolate Brownie", category: "Desserts", price: 320, available: true, description: "Warm fudge brownie" },
  { name: "Ice Cream Sundae", category: "Desserts", price: 290, available: true, description: "Vanilla ice cream with chocolate sauce" },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await MenuItem.deleteMany({});
    const created = await MenuItem.insertMany(menu);
    console.log(`Seeded ${created.length} menu items`);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
