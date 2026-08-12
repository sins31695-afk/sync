// Main script handling navigation, dynamic product rendering, slider gallery, order modal, cart, filtering, and forms
document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const toggle = document.querySelector('.menu-toggle');
  const links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // Support both PRODUCTS and myProducts variable definitions from products.js
  const productList = (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) 
    ? PRODUCTS 
    : ((typeof myProducts !== 'undefined' && Array.isArray(myProducts)) ? myProducts : []);

  const hasProducts = productList.length > 0;

  // CART SYSTEM (LocalStorage based)
  let cart = JSON.parse(localStorage.getItem('saree_cart') || '[]');

  function updateCartCounter() {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('.icon-btn').forEach(btn => {
      if (btn.textContent.includes('Cart')) {
        btn.textContent = `Cart (${totalCount})`;
      }
    });
  }
  updateCartCounter();

  // Helper to parse price string to number
  function parsePriceVal(priceStr) {
    if (!priceStr) return 0;
    const cleanStr = priceStr.toString().replace(/[^0-9.]/g, '');
    return parseFloat(cleanStr) || 0;
  }

  // Helper to format calculated price back to string format
  function formatPriceVal(numVal, sampleStr) {
    const isTk = sampleStr && sampleStr.toString().includes('৳');
    const formattedNum = numVal.toLocaleString('en-IN'); // Format with commas like 6,400
    if (isTk) {
      return `৳ ${formattedNum}`;
    } else {
      return `$${formattedNum}`;
    }
  }

  // Helper to render a single product card
  function renderCardHTML(product, index) {
    const id = product.id || `product-${index}`;
    let mediaContent = '';
    const mainImgSrc = (product.images && product.images.length > 0) ? product.images[0] : product.image;

    if (mainImgSrc && mainImgSrc.trim().startsWith('<svg')) {
      mediaContent = mainImgSrc;
    } else if (mainImgSrc && mainImgSrc.trim().length > 0) {
      mediaContent = `<img src="${mainImgSrc}" alt="${product.title || 'Saree'}" style="width:100%; height:100%; object-fit:cover;" />`;
    } else {
      mediaContent = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#1c1f27; color:#b08d57; font-family:var(--f-mono); font-size:12px;">Saree Atelier</div>`;
    }

    return `
      <a href="product.html?id=${encodeURIComponent(id)}" class="card" data-category="${product.category || 'saree'}">
        <div class="card-frame">
          ${mediaContent}
        </div>
        <div class="card-row">
          <div>
            <div class="card-title">${product.title || 'Modern Manipuri Saree'}</div>
            <div class="card-sub">${product.categoryLabel || product.category || 'Saree'}</div>
          </div>
          <div class="card-price">${product.price ? (product.price.toString().startsWith('৳') || product.price.toString().startsWith('$') ? product.price : '$' + product.price) : 'Enquire'}</div>
        </div>
      </a>
    `;
  }

  const emptyStateHTML = `
    <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; background: var(--paper-soft); border: 1px dashed var(--paper-line); border-radius: 4px;">
      <h3 style="font-size: 20px; margin-bottom: 10px;">No Products Uploaded Yet</h3>
      <p style="opacity: 0.7; font-size: 14px; max-width: 480px; margin: 0 auto;">
        To add your Modern Manipuri Saree products, edit the <code>products.js</code> file.
      </p>
    </div>
  `;

  // 1. HOME PAGE PRODUCTS GRID (#home-products-grid)
  const homeGrid = document.getElementById('home-products-grid');
  if (homeGrid) {
    if (!hasProducts) {
      homeGrid.innerHTML = emptyStateHTML;
    } else {
      const featuredList = productList.filter(p => p.featured).slice(0, 4);
      const displayList = featuredList.length > 0 ? featuredList : productList.slice(0, 4);
      homeGrid.innerHTML = displayList.map((p, idx) => renderCardHTML(p, idx)).join('');
    }
  }

  // 2. SHOP PAGE PRODUCTS GRID (#shop-products-grid or #shop-grid) & FILTERING
  const shopGrid = document.getElementById('shop-products-grid') || document.getElementById('shop-grid');
  if (shopGrid) {
    function renderShopProducts(filter = 'all') {
      if (!hasProducts) {
        shopGrid.innerHTML = emptyStateHTML;
        const countEl = document.querySelector('.result-count') || document.getElementById('result-count');
        if (countEl) countEl.textContent = '0 pieces';
        return;
      }

      const filtered = filter === 'all' 
        ? productList 
        : productList.filter(p => p.category === filter);
      
      if (filtered.length === 0) {
        shopGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; opacity:0.6;">No products found in this category.</div>`;
      } else {
        shopGrid.innerHTML = filtered.map((p, idx) => renderCardHTML(p, idx)).join('');
      }

      const countEl = document.querySelector('.result-count') || document.getElementById('result-count');
      if (countEl) {
        countEl.textContent = `${filtered.length} piece${filtered.length === 1 ? '' : 's'}`;
      }
    }

    renderShopProducts('all');

    const chips = document.querySelectorAll('.chip[data-filter]');
    if (chips.length) {
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          const filter = chip.dataset.filter;
          renderShopProducts(filter);
        });
      });
    }
  }

  // 3. PRODUCT DETAIL PAGE GALLERY & SLIDER (#product-detail-container)
  const detailContainer = document.getElementById('product-detail-container');
  if (detailContainer && hasProducts) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const product = productList.find(p => p.id === productId || p.title === productId) || productList[0];

    if (product) {
      document.title = `${product.title || 'Product Details'} — Modern Manipuri Saree`;

      let imgList = [];
      if (Array.isArray(product.images) && product.images.length > 0) {
        imgList = product.images.filter(img => img && img.trim().length > 0);
      } else if (product.image && product.image.trim().length > 0) {
        imgList = [product.image];
      }

      let galleryHTML = '';
      if (imgList.length > 0) {
        galleryHTML = `
          <div class="product-gallery">
            <div class="gallery-main" id="galleryMain">
              <img id="mainImage" src="${imgList[0]}" alt="${product.title || 'Saree'}" />
              ${imgList.length > 1 ? `
                <button class="gallery-nav gallery-prev" id="galleryPrev" aria-label="Previous Image"><i class="fa-solid fa-chevron-left"></i></button>
                <button class="gallery-nav gallery-next" id="galleryNext" aria-label="Next Image"><i class="fa-solid fa-chevron-right"></i></button>
                <div class="gallery-dots" id="galleryDots">
                  ${imgList.map((_, idx) => `<button class="gallery-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="Slide ${idx+1}"></button>`).join('')}
                </div>
              ` : ''}
            </div>
            ${imgList.length > 1 ? `
              <div class="gallery-thumbs" id="galleryThumbs">
                ${imgList.map((imgSrc, idx) => `
                  <div class="thumb-item ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                    <img src="${imgSrc}" alt="${product.title} view ${idx+1}" />
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      } else {
        galleryHTML = `<div class="split-media" style="aspect-ratio:3/4; display:flex; align-items:center; justify-content:center; color:#b08d57;">No Image</div>`;
      }

      const formattedPrice = product.price ? (product.price.toString().startsWith('৳') || product.price.toString().startsWith('$') ? product.price : '$' + product.price) : '৳ 3,200';
      const sizesOptions = product.sizes ? product.sizes.map((s, idx) => `<option ${idx === 0 ? 'selected' : ''}>${s}</option>`).join('') : '';
      const colorsOptions = product.colors ? product.colors.map((c, idx) => `<option ${idx === 0 ? 'selected' : ''}>${c}</option>`).join('') : '';
      const detailsList = product.details ? product.details.map(d => `<li>${d}</li>`).join('') : `<li>Material: 100% Pure Manipuri Cotton / Silk</li><li>Weave: Traditional Handloom</li><li>Origin: Bangladesh</li>`;

      detailContainer.innerHTML = `
        <div class="breadcrumb" style="margin-bottom:24px;"><a href="shop.html">Shop</a> / <span style="text-transform:capitalize">${product.category || 'Saree'}</span> / ${product.title}</div>
        <div class="split" style="align-items:flex-start;">
          <div>
            ${galleryHTML}
          </div>
          <div>
            <div class="eyebrow">${product.categoryLabel || product.category || 'Saree'}</div>
            <h1 style="font-size:clamp(30px,4vw,44px); margin-top:16px;">${product.title}</h1>
            <p style="font-family:var(--f-mono); font-size:24px; font-weight:600; margin-top:14px;">${formattedPrice}</p>

            <div class="prose" style="margin-top:24px; opacity:.85;">
              <p>${product.description || 'Authentic handwoven Modern Manipuri Saree crafted with traditional motifs and premium luxury comfort.'}</p>
            </div>

            ${(sizesOptions || colorsOptions) ? `
            <div class="field-row" style="margin-top:28px; max-width:420px;">
              ${sizesOptions ? `<div class="field"><label for="size">Option</label><select id="size">${sizesOptions}</select></div>` : ''}
              ${colorsOptions ? `<div class="field"><label for="color">Color</label><select id="color">${colorsOptions}</select></div>` : ''}
            </div>` : ''}

            <div style="margin-top:28px; display:flex; gap:12px; flex-wrap:wrap;">
              <button type="button" class="btn btn-solid" id="orderNowBtn" style="display:inline-flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-bag-shopping"></i> Order Now
              </button>
              <button type="button" class="btn" id="addToCartBtn" style="display:inline-flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-cart-plus"></i> Add to Cart
              </button>
            </div>

            <div style="margin-top:40px; border-top:1px solid var(--paper-line); padding-top:24px;">
              <h4 style="font-family:var(--f-mono); font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--brass); font-weight:400; margin-bottom:14px;">Product Specifications</h4>
              <ul style="display:flex; flex-direction:column; gap:8px; font-size:14px; opacity:.85;">
                ${detailsList}
              </ul>
            </div>
          </div>
        </div>
      `;

      // Setup Slider Logic if multiple images exist
      if (imgList.length > 1) {
        let currentIndex = 0;
        const mainImage = document.getElementById('mainImage');
        const prevBtn = document.getElementById('galleryPrev');
        const nextBtn = document.getElementById('galleryNext');
        const dots = document.querySelectorAll('.gallery-dot');
        const thumbs = document.querySelectorAll('.thumb-item');
        const galleryMain = document.getElementById('galleryMain');

        function updateSlider(newIndex) {
          if (newIndex < 0) newIndex = imgList.length - 1;
          if (newIndex >= imgList.length) newIndex = 0;
          currentIndex = newIndex;

          mainImage.style.opacity = '0.3';
          setTimeout(() => {
            mainImage.src = imgList[currentIndex];
            mainImage.style.opacity = '1';
          }, 150);

          dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentIndex));
          thumbs.forEach((thumb, idx) => thumb.classList.toggle('active', idx === currentIndex));
        }

        if (prevBtn) prevBtn.addEventListener('click', () => updateSlider(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => updateSlider(currentIndex + 1));

        dots.forEach(dot => {
          dot.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index);
            updateSlider(idx);
          });
        });

        thumbs.forEach(thumb => {
          thumb.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index);
            updateSlider(idx);
          });
        });

        // Mobile touch swipe support
        let startX = 0;
        let endX = 0;

        if (galleryMain) {
          galleryMain.addEventListener('touchstart', (e) => {
            startX = e.changedTouches[0].screenX;
          }, { passive: true });

          galleryMain.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].screenX;
            if (startX - endX > 40) {
              updateSlider(currentIndex + 1);
            } else if (endX - startX > 40) {
              updateSlider(currentIndex - 1);
            }
          }, { passive: true });
        }
      }

      // Add to Cart Button Logic
      const addToCartBtn = document.getElementById('addToCartBtn');
      if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
          const existing = cart.find(item => item.id === product.id);
          if (existing) {
            existing.qty += 1;
          } else {
            cart.push({
              id: product.id,
              title: product.title,
              price: formattedPrice,
              unitPriceNum: parsePriceVal(formattedPrice),
              image: imgList[0] || '',
              url: window.location.href,
              qty: 1
            });
          }
          localStorage.setItem('saree_cart', JSON.stringify(cart));
          updateCartCounter();
          
          addToCartBtn.innerHTML = `<i class="fa-solid fa-check"></i> Added to Cart!`;
          setTimeout(() => {
            addToCartBtn.innerHTML = `<i class="fa-solid fa-cart-plus"></i> Add to Cart`;
          }, 2000);
        });
      }

      // Order Now Button Logic
      const orderNowBtn = document.getElementById('orderNowBtn');
      if (orderNowBtn) {
        orderNowBtn.addEventListener('click', () => {
          const orderItems = [{
            id: product.id,
            title: product.title,
            price: formattedPrice,
            unitPriceNum: parsePriceVal(formattedPrice),
            image: imgList[0] || '',
            url: window.location.href,
            qty: 1
          }];
          openOrderModal(orderItems);
        });
      }
    }
  }

  // 4. ORDER MODAL SYSTEM
  const modalHTML = `
    <div class="modal-overlay" id="orderModalOverlay">
      <div class="order-modal">
        <button type="button" class="modal-close" id="closeModalBtn" aria-label="Close Order Modal">&times;</button>
        <h3 class="modal-title">Complete Your Order</h3>
        <p class="modal-subtitle">Fill in your details below to send your order directly to our WhatsApp.</p>
        
        <form id="whatsappOrderForm">
          <div id="orderItemsContainer"></div>

          <button type="button" class="add-more-btn" id="toggleAddProductBtn">
            <i class="fa-solid fa-plus"></i> Add Another Product to Order
          </button>

          <div class="product-picker-dropdown" id="productPickerDropdown">
            <div style="font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; opacity:0.7;">Select a product to add:</div>
            <div id="pickerItemsList"></div>
          </div>

          <div class="field">
            <label for="cust-name">Your Full Name *</label>
            <input type="text" id="cust-name" placeholder="e.g. Nusrat Jahan" required>
          </div>

          <div class="field">
            <label for="cust-phone">Phone Number *</label>
            <input type="tel" id="cust-phone" placeholder="e.g. 01810000000" required>
          </div>

          <div class="field">
            <label for="cust-address">Delivery Address *</label>
            <textarea id="cust-address" placeholder="House no, Road no, Area, District..." required style="min-height:80px;"></textarea>
          </div>

          <div id="modalOrderSummary" style="border-top:1px solid var(--paper-line); padding-top:14px; margin-top:14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; font-weight:600; font-size:16px;">
            <span>Grand Total:</span>
            <span id="grandTotalPrice" style="font-family:var(--f-mono); color:var(--brass); font-size:18px;">৳ 0</span>
          </div>

          <button type="submit" class="btn btn-solid" style="width:100%; justify-content:center; padding:16px; margin-top:8px;">
            <i class="fa-brands fa-whatsapp" style="font-size:18px;"></i> Complete Order via WhatsApp
          </button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modalOverlay = document.getElementById('orderModalOverlay');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const orderItemsContainer = document.getElementById('orderItemsContainer');
  const toggleAddProductBtn = document.getElementById('toggleAddProductBtn');
  const productPickerDropdown = document.getElementById('productPickerDropdown');
  const pickerItemsList = document.getElementById('pickerItemsList');
  const whatsappOrderForm = document.getElementById('whatsappOrderForm');
  const grandTotalPriceEl = document.getElementById('grandTotalPrice');

  let currentOrderItems = [];

  function renderOrderItems() {
    if (currentOrderItems.length === 0) {
      orderItemsContainer.innerHTML = `<div style="text-align:center; padding:20px; opacity:0.6;">No items selected.</div>`;
      if (grandTotalPriceEl) grandTotalPriceEl.textContent = '৳ 0';
      return;
    }

    let overallTotalNum = 0;
    let samplePriceStr = currentOrderItems[0].price;

    orderItemsContainer.innerHTML = currentOrderItems.map((item, index) => {
      const unitNum = item.unitPriceNum || parsePriceVal(item.price);
      const calculatedItemTotal = unitNum * item.qty;
      overallTotalNum += calculatedItemTotal;

      const formattedItemTotalStr = formatPriceVal(calculatedItemTotal, item.price);
      const formattedUnitStr = formatPriceVal(unitNum, item.price);

      return `
        <div class="order-product-card">
          ${item.image ? `<img src="${item.image}" alt="${item.title}" class="order-product-img" />` : ''}
          <div class="order-product-info">
            <div class="order-product-title">${item.title}</div>
            <div class="order-product-price">
              Total: ${formattedItemTotalStr} ${item.qty > 1 ? `<span style="font-size:12px; opacity:0.75; font-weight:normal;">(${formattedUnitStr} x ${item.qty})</span>` : ''}
            </div>
            <!-- Invisible product link on interface -->
            <div class="qty-control">
              <button type="button" class="qty-btn" onclick="window.changeItemQty(${index}, -1)">-</button>
              <span class="qty-val">${item.qty}</span>
              <button type="button" class="qty-btn" onclick="window.changeItemQty(${index}, 1)">+</button>
            </div>
          </div>
          ${currentOrderItems.length > 1 ? `<button type="button" style="background:none; border:none; color:#dc3545; cursor:pointer; font-size:18px;" onclick="window.removeItemFromOrder(${index})" title="Remove">&times;</button>` : ''}
        </div>
      `;
    }).join('');

    if (grandTotalPriceEl) {
      grandTotalPriceEl.textContent = formatPriceVal(overallTotalNum, samplePriceStr);
    }
  }

  window.changeItemQty = function(index, delta) {
    if (currentOrderItems[index]) {
      currentOrderItems[index].qty += delta;
      if (currentOrderItems[index].qty <= 0) {
        currentOrderItems[index].qty = 1;
      }
      renderOrderItems();
    }
  };

  window.removeItemFromOrder = function(index) {
    currentOrderItems.splice(index, 1);
    renderOrderItems();
  };

  function openOrderModal(items) {
    currentOrderItems = items.map(i => {
      const uNum = i.unitPriceNum || parsePriceVal(i.price);
      return {
        ...i,
        unitPriceNum: uNum
      };
    });
    renderOrderItems();
    productPickerDropdown.classList.remove('open');
    modalOverlay.classList.add('open');
  }

  closeModalBtn.addEventListener('click', () => modalOverlay.classList.remove('open'));
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('open');
  });

  // Populate Picker Dropdown
  if (pickerItemsList) {
    pickerItemsList.innerHTML = productList.map(p => {
      const pImg = (p.images && p.images.length > 0) ? p.images[0] : p.image;
      const pPrice = p.price ? (p.price.toString().startsWith('৳') || p.price.toString().startsWith('$') ? p.price : '$' + p.price) : '৳ 3,200';
      return `
        <div class="picker-item" data-id="${p.id}">
          <div style="display:flex; align-items:center; gap:10px;">
            ${pImg ? `<img src="${pImg}" style="width:36px; height:46px; object-fit:cover; border-radius:2px;" />` : ''}
            <div>
              <div style="font-weight:600; font-size:13px;">${p.title}</div>
              <div style="font-size:11px; opacity:0.6;">${pPrice}</div>
            </div>
          </div>
          <button type="button" class="btn" style="padding:6px 12px; font-size:10px;">+ Add</button>
        </div>
      `;
    }).join('');

    pickerItemsList.querySelectorAll('.picker-item').forEach(itemEl => {
      itemEl.addEventListener('click', () => {
        const pId = itemEl.dataset.id;
        const targetProduct = productList.find(p => p.id === pId);
        if (targetProduct) {
          const pImg = (targetProduct.images && targetProduct.images.length > 0) ? targetProduct.images[0] : targetProduct.image;
          const pPrice = targetProduct.price ? (targetProduct.price.toString().startsWith('৳') || targetProduct.price.toString().startsWith('$') ? targetProduct.price : '$' + targetProduct.price) : '৳ 3,200';
          const pUrl = `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}/product.html?id=${encodeURIComponent(targetProduct.id)}`;
          
          const existing = currentOrderItems.find(i => i.id === targetProduct.id);
          if (existing) {
            existing.qty += 1;
          } else {
            currentOrderItems.push({
              id: targetProduct.id,
              title: targetProduct.title,
              price: pPrice,
              unitPriceNum: parsePriceVal(pPrice),
              image: pImg,
              url: pUrl,
              qty: 1
            });
          }
          renderOrderItems();
          productPickerDropdown.classList.remove('open');
        }
      });
    });
  }

  toggleAddProductBtn.addEventListener('click', () => {
    productPickerDropdown.classList.toggle('open');
  });

  // Handle Order Submit via WhatsApp
  whatsappOrderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const address = document.getElementById('cust-address').value.trim();

    if (currentOrderItems.length === 0) {
      alert('Please select at least one product.');
      return;
    }

    let itemsSummaryText = '';
    let totalPieces = 0;
    let grandTotalNum = 0;
    let samplePriceStr = currentOrderItems[0].price;

    currentOrderItems.forEach((item, idx) => {
      totalPieces += item.qty;
      const unitNum = item.unitPriceNum || parsePriceVal(item.price);
      const itemSubtotal = unitNum * item.qty;
      grandTotalNum += itemSubtotal;

      const formattedSubtotal = formatPriceVal(itemSubtotal, item.price);

      itemsSummaryText += `\n${idx + 1}. *${item.title}*\n   - Quantity: ${item.qty} pcs\n   - Item Price: ${formattedSubtotal} (${item.price} x ${item.qty})\n   - Product Link: ${item.url}\n`;
    });

    const formattedGrandTotal = formatPriceVal(grandTotalNum, samplePriceStr);

    const fullMessage = `🛍️ *NEW ORDER - MODERN MANIPURI SAREE*
--------------------------------
👤 *Customer Name:* ${name}
📞 *Phone:* ${phone}
📍 *Delivery Address:* ${address}

📦 *ORDERED PRODUCTS:*
${itemsSummaryText}
--------------------------------
📊 *Total Pieces:* ${totalPieces} pcs
💰 *Grand Total:* ${formattedGrandTotal}
--------------------------------
Hello! Please confirm my order. Thank you!`;

    const whatsappUrl = `https://wa.me/8801810800026?text=${encodeURIComponent(fullMessage)}`;
    window.open(whatsappUrl, '_blank');

    modalOverlay.classList.remove('open');
    whatsappOrderForm.reset();
  });

  // Handle Header Cart (0) Button Click to open Cart / Checkout
  document.querySelectorAll('.icon-btn').forEach(btn => {
    if (btn.textContent.includes('Cart')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (cart.length === 0) {
          alert('Your Cart is currently empty. Add products from the shop to order!');
        } else {
          openOrderModal(cart);
        }
      });
    }
  });

  // Newsletter + contact form handling
  document.querySelectorAll('form[data-demo-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = form.querySelector('.form-status');
      if(msg) msg.textContent = form.dataset.successMsg || 'Thank you — we\u2019ll be in touch.';
      form.reset();
    });
  });

  // Footer year
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
});
