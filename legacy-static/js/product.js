/* =====================================================
   TIRUPATI JEWELLERS
   SHARED PRODUCT SYSTEM
   ===================================================== */

   "use strict";


   /* =====================================================
      STORAGE KEY
      ===================================================== */
   
   const PRODUCT_STORAGE_KEY = "products";
   
   
   /* =====================================================
      DEFAULT PRODUCTS
      ===================================================== */
   
   const defaultProducts = [
   
       {
           id: 1,
           name: "Royal Gold Necklace",
           category: "necklaces",
           price: 24999,
           badge: "NEW",
           image: "image/products/royal-gold-necklace.jpg"
       },
   
       {
           id: 2,
           name: "Elegant Diamond Ring",
           category: "rings",
           price: 18499,
           badge: "BESTSELLER",
           image: "image/products/elegant-diamond-ring.jpg"
       },
   
       {
           id: 3,
           name: "Classic Gold Earrings",
           category: "earrings",
           price: 12999,
           badge: "NEW",
           image: "image/products/classic-gold-earrings.jpg"
       },
   
       {
           id: 4,
           name: "Royal Gold Bracelet",
           category: "bracelets",
           price: 15999,
           badge: "FEATURED",
           image: "image/products/royal-gold-bracelet.jpg"
       },
   
       {
           id: 5,
           name: "Diamond Pendant",
           category: "necklaces",
           price: 21999,
           badge: "NEW",
           image: "image/products/diamond-pendant.jpg"
       },
   
       {
           id: 6,
           name: "Classic Gold Ring",
           category: "rings",
           price: 14999,
           badge: "POPULAR",
           image: "image/products/classic-gold-ring.jpg"
       }
   
   ];
   
   
   /* =====================================================
      LOAD PRODUCTS
      ===================================================== */
   
   function getProducts() {
   
       let saved = localStorage.getItem(PRODUCT_STORAGE_KEY);
   
   
       /* ---------------------------------------------
          OLD adminProducts MIGRATION
          --------------------------------------------- */
   
       if (!saved) {
   
           const oldAdminProducts =
               localStorage.getItem("adminProducts");
   
   
           if (oldAdminProducts) {
   
               try {
   
                   const oldProducts =
                       JSON.parse(oldAdminProducts);
   
   
                   if (
                       Array.isArray(oldProducts) &&
                       oldProducts.length > 0
                   ) {
   
                       localStorage.setItem(
                           PRODUCT_STORAGE_KEY,
                           JSON.stringify(oldProducts)
                       );
   
                       saved =
                           JSON.stringify(oldProducts);
   
                   }
   
               } catch (error) {
   
                   console.error(
                       "Old product data error:",
                       error
                   );
   
               }
   
           }
   
       }
   
   
       /* ---------------------------------------------
          LOAD CURRENT PRODUCTS
          --------------------------------------------- */
   
       if (saved) {
   
           try {
   
               const parsed =
                   JSON.parse(saved);
   
   
               if (Array.isArray(parsed)) {
   
                   return parsed;
   
               }
   
           } catch (error) {
   
               console.error(
                   "Product storage error:",
                   error
               );
   
           }
   
       }
   
   
       /* ---------------------------------------------
          FIRST INSTALL
          --------------------------------------------- */
   
       localStorage.setItem(
           PRODUCT_STORAGE_KEY,
           JSON.stringify(defaultProducts)
       );
   
   
       return [...defaultProducts];
   
   }
   
   
   /* =====================================================
      GLOBAL PRODUCTS
      ===================================================== */
   
   let products = getProducts();
   
   
   window.products = products;
   
   
   /* =====================================================
      SAVE PRODUCTS
      ===================================================== */
   
   function saveProducts(newProducts) {
   
       products = Array.isArray(newProducts)
           ? newProducts
           : [];
   
   
       window.products = products;
   
   
       localStorage.setItem(
           PRODUCT_STORAGE_KEY,
           JSON.stringify(products)
       );
   
   
       console.log(
           "PRODUCTS SAVED:",
           products
       );
   
   }
   
   
   /* =====================================================
      GET PRODUCT
      ===================================================== */
   
   function getProductById(id) {
   
       return products.find(
           product =>
               Number(product.id) === Number(id)
       );
   
   }
   
   
   /* =====================================================
      GENERATE ID
      ===================================================== */
   
   function generateProductId() {
   
       if (products.length === 0) {
   
           return 1;
   
       }
   
   
       const ids =
           products.map(
               product =>
                   Number(product.id) || 0
           );
   
   
       return Math.max(...ids) + 1;
   
   }
   
   
   /* =====================================================
      ADD PRODUCT
      ===================================================== */
   
   function addProduct(productData) {
   
       const newProduct = {
   
           id: generateProductId(),
   
           name:
               String(
                   productData.name || ""
               ).trim(),
   
           category:
               String(
                   productData.category || ""
               ).trim().toLowerCase(),
   
           price:
               Number(
                   productData.price || 0
               ),
   
           badge:
               String(
                   productData.badge || ""
               ).trim(),
   
           image:
               String(
                   productData.image || ""
               ).trim()
   
       };
   
   
       products.push(newProduct);
   
   
       saveProducts(products);
   
   
       return newProduct;
   
   }
   
   
   /* =====================================================
      UPDATE PRODUCT
      ===================================================== */
   
   function updateProduct(id, productData) {
   
       const index =
           products.findIndex(
               product =>
                   Number(product.id) === Number(id)
           );
   
   
       if (index === -1) {
   
           return false;
   
       }
   
   
       products[index] = {
   
           ...products[index],
   
           name:
               String(
                   productData.name ??
                   products[index].name
               ).trim(),
   
           category:
               String(
                   productData.category ??
                   products[index].category
               ).trim().toLowerCase(),
   
           price:
               Number(
                   productData.price ??
                   products[index].price
               ),
   
           badge:
               String(
                   productData.badge ??
                   products[index].badge
               ).trim(),
   
           image:
               String(
                   productData.image ??
                   products[index].image
               ).trim()
   
       };
   
   
       saveProducts(products);
   
   
       return true;
   
   }
   
   
   /* =====================================================
      DELETE PRODUCT
      ===================================================== */
   
   function deleteProduct(id) {
   
       const oldLength =
           products.length;
   
   
       products =
           products.filter(
               product =>
                   Number(product.id) !== Number(id)
           );
   
   
       if (products.length === oldLength) {
   
           return false;
   
       }
   
   
       saveProducts(products);
   
   
       return true;
   
   }
   
   
   /* =====================================================
      CART
      ===================================================== */
   
   function getCart() {
   
       try {
   
           return JSON.parse(
               localStorage.getItem("cart") || "[]"
           );
   
       } catch (error) {
   
           return [];
   
       }
   
   }
   
   
   /* =====================================================
      CART COUNT
      ===================================================== */
   
   function updateCartCount() {
   
       const cart = getCart();
   
   
       const count =
           cart.reduce(
               (total, item) =>
                   total +
                   Number(item.quantity || 0),
               0
           );
   
   
       const cartCount =
           document.getElementById("cart-count");
   
   
       if (cartCount) {
   
           cartCount.textContent = count;
   
       }
   
   }
   
   
   /* =====================================================
      ADD TO CART
      ===================================================== */
   
   function addToCart(productId) {
   
       const product =
           getProductById(productId);
   
   
       if (!product) {
   
           alert("Product not found.");
   
           return;
   
       }
   
   
       const cart = getCart();
   
   
       const existing =
           cart.find(
               item =>
                   Number(item.id) ===
                   Number(product.id)
           );
   
   
       if (existing) {
   
           existing.quantity =
               Number(existing.quantity || 0) + 1;
   
       } else {
   
           cart.push({
   
               id: product.id,
   
               name: product.name,
   
               price: Number(product.price),
   
               image: product.image,
   
               quantity: 1
   
           });
   
       }
   
   
       localStorage.setItem(
           "cart",
           JSON.stringify(cart)
       );
   
   
       updateCartCount();
   
   }
   
   
   /* =====================================================
      RENDER SHOP
      ===================================================== */
   
   function renderShopProducts() {
   
       const productGrid =
           document.getElementById("product-grid");
   
   
       if (!productGrid) {
   
           return;
   
       }
   
   
       /* ALWAYS RELOAD FROM STORAGE */
   
       products = getProducts();
   
       window.products = products;
   
   
       const params =
           new URLSearchParams(
               window.location.search
           );
   
   
       const category =
           params.get("category");
   
   
       let filteredProducts =
           [...products];
   
   
       /* CATEGORY */
   
       if (category) {
   
           filteredProducts =
               products.filter(
                   product =>
                       String(product.category)
                           .toLowerCase() ===
                       String(category)
                           .toLowerCase()
               );
   
       }
   
   
       /* EMPTY */
   
       if (filteredProducts.length === 0) {
   
           productGrid.innerHTML = `
   
               <div class="no-products">
   
                   <h2>
                       No products found
                   </h2>
   
                   <p>
                       Please explore another collection.
                   </p>
   
               </div>
   
           `;
   
           return;
   
       }
   
   
       /* DISPLAY */
   
       productGrid.innerHTML =
           filteredProducts.map(
               product => `
   
               <article class="product-card">
   
                   <a
                       href="product.html?id=${product.id}"
                       class="product-image"
                   >
   
                       ${
                           product.badge
                           ?
                           `
                           <span class="product-badge">
                               ${product.badge}
                           </span>
                           `
                           :
                           ""
                       }
   
                       <img
                           src="${product.image}"
                           alt="${product.name}"
                           onerror="this.style.display='none'"
                       >
   
                   </a>
   
   
                   <div class="product-info">
   
                       <span class="product-category">
                           ${product.category}
                       </span>
   
   
                       <h3>
                           ${product.name}
                       </h3>
   
   
                       <p class="product-price">
                           ₹${Number(product.price)
                               .toLocaleString("en-IN")}
                       </p>
   
   
                       <button
                           type="button"
                           class="add-to-cart"
                           data-id="${product.id}"
                       >
                           ADD TO CART
                       </button>
   
                   </div>
   
               </article>
   
           `
           ).join("");
   
   
       /* ADD TO CART BUTTONS */
   
       productGrid
           .querySelectorAll(".add-to-cart")
           .forEach(button => {
   
               button.addEventListener(
                   "click",
                   function(event) {
   
                       event.preventDefault();
                       event.stopPropagation();
   
   
                       const id =
                           Number(
                               this.dataset.id
                           );
   
   
                       addToCart(id);
   
   
                       this.textContent =
                           "ADDED ✓";
   
   
                       this.disabled = true;
   
   
                       setTimeout(() => {
   
                           this.textContent =
                               "ADD TO CART";
   
                           this.disabled = false;
   
                       }, 1200);
   
                   }
               );
   
           });
   
   }
   
   
   /* =====================================================
      STORAGE CHANGE
      Updates Shop automatically if Admin is open
      in another tab.
      ===================================================== */
   
   window.addEventListener(
       "storage",
       function(event) {
   
           if (
               event.key === PRODUCT_STORAGE_KEY
           ) {
   
               products = getProducts();
   
               window.products = products;
   
               renderShopProducts();
   
           }
   
       }
   );
   
   
   /* =====================================================
      EXPORT
      ===================================================== */
   
   window.getProducts =
       getProducts;
   
   window.saveProducts =
       saveProducts;
   
   window.getProductById =
       getProductById;
   
   window.addProduct =
       addProduct;
   
   window.updateProduct =
       updateProduct;
   
   window.deleteProduct =
       deleteProduct;
   
   window.generateProductId =
       generateProductId;
   
   window.addToCart =
       addToCart;
   
   window.updateCartCount =
       updateCartCount;
   
   window.renderShopProducts =
       renderShopProducts;
   
   
   /* =====================================================
      INITIALIZE
      ===================================================== */
   
   renderShopProducts();
   
   updateCartCount();
   
   
   console.log(
       "TIRUPATI JEWELLERS PRODUCT SYSTEM LOADED"
   );
   
   console.log(
       "TOTAL PRODUCTS:",
       products.length
   );
   
   console.log(
       "PRODUCT DATA:",
       products
   );