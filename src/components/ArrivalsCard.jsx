import React, { useState } from "react";
import { FaShoppingCart } from "react-icons/fa";

const ArrivalsCard = ({ img, name, price }) => {
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCartClick = (event) => {
    event.stopPropagation(); // Prevent any parent click events
    setShowQuantitySelector(true);
  };

  const handleDecrement = (event) => {
    event.stopPropagation(); // Prevent any parent click events
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleIncrement = (event) => {
    event.stopPropagation(); // Prevent any parent click events
    setQuantity((prev) => prev + 1);
  };

  const confirmAddToCart = (event) => {
    event.stopPropagation(); // Prevent any parent click events
    console.log(`Added ${quantity} of ${name} to the cart`);
    setShowQuantitySelector(false);
    setQuantity(1); // Reset quantity after confirming
  };

  const cancelAddToCart = (event) => {
    event.stopPropagation(); // Prevent any parent click events
    setShowQuantitySelector(false);
    setQuantity(1); // Reset quantity if canceled
  };

  return (
    <div className="card" style={styles.card}>
      <img src={img} alt={name} className="product-image" style={styles.image} />
      <h3 className="product-name" style={styles.name}>{name}</h3>
      <p className="product-price" style={styles.price}>{price}</p>

      {/* Cart Icon */}
      <div style={styles.cartIconContainer}>
        <FaShoppingCart 
          className="cart-icon" 
          onClick={handleAddToCartClick} 
        />
      </div>

      {/* Quantity Selector at the Bottom */}
      {showQuantitySelector && (
        <div className="quantity-selector" style={styles.quantitySelector} onClick={(e) => e.stopPropagation()}>
          <div className="quantity-controls" style={styles.quantityControls}>
            <button onClick={handleDecrement} style={styles.button}>-</button>
            <span>{quantity}</span>
            <button onClick={handleIncrement} style={styles.button}>+</button>
          </div>
          <div className="quantity-actions" style={styles.quantityActions}>
            <button onClick={confirmAddToCart} className="confirm-cart-btn" style={styles.confirmButton}>
              Confirm
            </button>
            <button onClick={cancelAddToCart} className="cancel-cart-btn" style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    textAlign: "center",
    width: "90%",
    maxWidth: "400px",
    minHeight: "450px",
    backgroundColor: "#f9dcdc",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", 
    padding: "12px",
    position: "relative",
    transition: "transform 0.2s",
  },
  image: {
    width: "100%",
    height: "300px",
    objectFit: "cover",
    objectPosition: "center",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  name: {
    fontSize: "1.2em", 
    margin: "8px 0", 
  },
  price: {
    fontSize: "1em", 
  },
  cartIconContainer: {
    marginTop: "8px",
    cursor: "pointer",
  },
  quantitySelector: {
    marginTop: "16px",
    padding: "12px",
    backgroundColor: "#f9dcdc",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
  quantityControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "8px",
  },
  button: {
    padding: "4px 8px",
    fontSize: "16px",
  },
  quantityActions: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "8px",
  },
  confirmButton: {
    backgroundColor: "#e37c8e",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  },
  cancelButton: {
    backgroundColor: "#e37c8e",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
  },
};

export default ArrivalsCard;
