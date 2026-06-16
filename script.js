document.addEventListener("DOMContentLoaded", function () {
    var searchInput = document.querySelector(".search-box input");
    var categoryItems = Array.from(document.querySelectorAll(".category"));
    var cards = Array.from(document.querySelectorAll(".card"));
    var cartButton = document.querySelector(".cart-btn");
    var loginLink = document.querySelector(".nav-right a");
    var cart = {};
    var activeCategory = "All";
    var productGrid = document.querySelector(".product-grid");
    var extraCategories = ["Tea & Coffee", "Bakery & Cakes", "Instant Food"];
    var extraProducts = [
        {
            image: "tea.webp",
            name: "Tata Tea Premium",
            size: "250 gm",
            price: 120
        }
    ];

    var categoryMap = {
        "Milk": ["mishti doi", "curd", "dahi", "milk"],
        "Bread & Pav": ["bread", "pizza base", "oven"],
        "Eggs": ["egg"],
        "Flakes & Cereals": ["chocos", "kellogg", "cereal", "flakes"],
        "Breakfast Mixes": ["idli", "breakfast", "mix"],
        "Butter And More": ["butter", "ghee"],
        "Oats": ["oats"],
        "Panner And Tofu": ["paneer", "panner", "tofu"],
        "Dairy Products": ["amul", "dairy", "doi", "curd", "paneer", "panner", "butter", "ghee"],
        "Snacks": ["kurkure", "chips", "cake"],
        "Cold Drinks": ["thumbs up", "drink", "ml"],
        "Tea & Coffee": ["tea", "coffee", "chai"],
        "Bakery & Cakes": ["bread", "cake", "pizza base", "bakery"],
        "Instant Food": ["idli", "breakfast", "mix", "pizza base"]
    };

    appendExtraCategories();
    appendExtraProducts();
    categoryItems = Array.from(document.querySelectorAll(".category"));
    cards = Array.from(document.querySelectorAll(".card"));

    cards.forEach(function (card, index) {
        var name = card.querySelector("h4").textContent.trim();
        var size = card.querySelector("p").textContent.trim();
        var priceText = card.querySelector(".price-add span").textContent.trim();
        var price = Number(priceText.replace(/[^0-9]/g, ""));
        var button = card.querySelector(".price-add button");

        card.dataset.id = String(index);
        card.dataset.name = name;
        card.dataset.size = size;
        card.dataset.price = String(price);
        card.dataset.searchText = (name + " " + size).toLowerCase();

        button.addEventListener("click", function () {
            addToCart(card);
        });
    });

    categoryItems.forEach(function (item) {
        item.addEventListener("click", function () {
            categoryItems.forEach(function (category) {
                category.classList.remove("active");
            });

            item.classList.add("active");
            activeCategory = item.textContent.trim();
            filterProducts();
        });
    });

    if (categoryItems.length) {
        categoryItems[0].classList.add("active");
    }

    searchInput.addEventListener("input", filterProducts);

    cartButton.addEventListener("click", function () {
        showCart();
    });

    makeLoginVisible();

    loginLink.addEventListener("click", function (event) {
        event.preventDefault();
        showLogin();
    });

    updateCartButton();
    applyInitialPageState();
    filterProducts();

    function appendExtraCategories() {
        var sidebar = document.querySelector(".sidebar");

        extraCategories.forEach(function (categoryName) {
            var alreadyExists = Array.from(document.querySelectorAll(".category")).some(function (category) {
                return category.textContent.trim() === categoryName;
            });

            if (alreadyExists) {
                return;
            }

            var category = document.createElement("div");
            category.className = "category";
            category.textContent = categoryName;
            sidebar.appendChild(category);
        });
    }

    function appendExtraProducts() {
        extraProducts.forEach(function (product) {
            var alreadyExists = Array.from(document.querySelectorAll(".card h4")).some(function (heading) {
                return heading.textContent.trim() === product.name;
            });

            if (alreadyExists) {
                return;
            }

            var card = document.createElement("div");
            card.className = "card";
            card.innerHTML = '<img src="' + escapeHtml(product.image) + '" height="79px">' +
                '<span class="time">8 MINS</span>' +
                '<h4>' + escapeHtml(product.name) + '</h4>' +
                '<p>' + escapeHtml(product.size) + '</p>' +
                '<div class="price-add">' +
                '<span>Rs.' + product.price + '</span>' +
                '<button>ADD</button>' +
                '</div>';

            productGrid.appendChild(card);
        });
    }

    function addToCart(card) {
        var id = card.dataset.id;

        if (!cart[id]) {
            cart[id] = {
                name: card.dataset.name,
                size: card.dataset.size,
                price: Number(card.dataset.price),
                quantity: 0
            };
        }

        cart[id].quantity += 1;
        updateCardButton(card);
        updateCartButton();
        showToast(cart[id].name + " added to cart");
    }

    function removeFromCart(id) {
        if (!cart[id]) {
            return;
        }

        cart[id].quantity -= 1;

        if (cart[id].quantity <= 0) {
            delete cart[id];
        }

        var card = document.querySelector('.card[data-id="' + id + '"]');
        if (card) {
            updateCardButton(card);
        }

        updateCartButton();
        showCart();
    }

    function updateCardButton(card) {
        var id = card.dataset.id;
        var button = card.querySelector(".price-add button");
        var item = cart[id];

        if (!item) {
            button.textContent = "ADD";
            button.style.background = "white";
            button.style.color = "green";
            return;
        }

        button.textContent = "ADDED (" + item.quantity + ")";
        button.style.background = "green";
        button.style.color = "white";
    }

    function updateCartButton() {
        var totals = getCartTotals();

        if (totals.quantity === 0) {
            cartButton.textContent = "My Cart";
            return;
        }

        cartButton.textContent = "My Cart (" + totals.quantity + ") Rs." + totals.amount;
    }

    function filterProducts() {
        var query = searchInput.value.trim().toLowerCase();
        var visibleCount = 0;

        cards.forEach(function (card) {
            var matchesSearch = card.dataset.searchText.indexOf(query) !== -1;
            var matchesCategory = isInCategory(card, activeCategory);
            var isVisible = matchesSearch && matchesCategory;

            card.style.display = isVisible ? "" : "none";
            if (isVisible) {
                visibleCount += 1;
            }
        });

        renderEmptyState(visibleCount);
    }

    function applyInitialPageState() {
        var params = new URLSearchParams(window.location.search);
        var category = params.get("category");
        var search = params.get("search");

        if (search) {
            searchInput.value = search;
        }

        if (!category) {
            return;
        }

        var requestedCategory = decodeURIComponent(category);
        var matchingCategory = categoryItems.find(function (item) {
            return item.textContent.trim().toLowerCase() === requestedCategory.toLowerCase();
        });

        if (!matchingCategory) {
            return;
        }

        categoryItems.forEach(function (item) {
            item.classList.remove("active");
        });

        matchingCategory.classList.add("active");
        activeCategory = matchingCategory.textContent.trim();
    }

    function isInCategory(card, category) {
        var keywords = categoryMap[category];

        if (!keywords) {
            return true;
        }

        return keywords.some(function (keyword) {
            return card.dataset.searchText.indexOf(keyword) !== -1;
        });
    }

    function renderEmptyState(visibleCount) {
        var grid = document.querySelector(".product-grid");
        var emptyState = document.querySelector(".empty-state");

        if (visibleCount > 0) {
            if (emptyState) {
                emptyState.remove();
            }
            return;
        }

        if (!emptyState) {
            emptyState = document.createElement("div");
            emptyState.className = "empty-state";
            emptyState.textContent = "No products found";
            emptyState.style.background = "white";
            emptyState.style.padding = "30px";
            emptyState.style.borderRadius = "15px";
            emptyState.style.textAlign = "center";
            emptyState.style.color = "gray";
            grid.appendChild(emptyState);
        }
    }

    function showCart() {
        var totals = getCartTotals();
        var rows = Object.keys(cart).map(function (id) {
            var item = cart[id];
            return '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin:12px 0;">' +
                '<div><strong>' + escapeHtml(item.name) + '</strong><p style="font-size:12px;color:gray;margin-top:4px;">' + escapeHtml(item.size) + ' x ' + item.quantity + '</p></div>' +
                '<div style="text-align:right;"><strong>Rs.' + (item.price * item.quantity) + '</strong><br><button data-remove="' + id + '" style="margin-top:6px;border:1px solid green;background:white;color:green;border-radius:6px;padding:4px 10px;cursor:pointer;">Remove</button></div>' +
                '</div>';
        }).join("");

        if (!rows) {
            rows = '<p style="color:gray;margin:16px 0;">Your cart is empty.</p>';
        }

        showModal("My Cart", rows + '<hr style="border:none;border-top:1px solid #eee;margin:16px 0;"><strong>Total: Rs.' + totals.amount + '</strong>');

        document.querySelectorAll("[data-remove]").forEach(function (button) {
            button.addEventListener("click", function () {
                removeFromCart(button.dataset.remove);
            });
        });
    }

    function showMessage(title, message) {
        showModal(title, '<p style="color:#555;line-height:1.5;">' + escapeHtml(message) + '</p>');
    }

    function showLogin() {
        showModal("Login", '<p style="color:#555;line-height:1.5;margin-bottom:12px;">Enter your mobile number to continue.</p>' +
            '<input class="js-login-phone" type="tel" maxlength="10" placeholder="Mobile number" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;background:#f7f7f7;margin-bottom:12px;">' +
            '<button class="js-login-submit" style="width:100%;border:none;background:green;color:white;border-radius:10px;padding:12px;cursor:pointer;">Continue</button>' +
            '<p class="js-login-message" style="font-size:12px;color:gray;margin-top:10px;"></p>');

        var phoneInput = document.querySelector(".js-login-phone");
        var submitButton = document.querySelector(".js-login-submit");
        var message = document.querySelector(".js-login-message");

        phoneInput.focus();

        submitButton.addEventListener("click", function () {
            var phone = phoneInput.value.trim();

            if (!/^[0-9]{10}$/.test(phone)) {
                message.textContent = "Please enter a valid 10 digit mobile number.";
                message.style.color = "red";
                return;
            }

            message.textContent = "Login request sent successfully.";
            message.style.color = "green";
            loginLink.textContent = "Account";
            setTimeout(closeModal, 900);
        });
    }

    function makeLoginVisible() {
        loginLink.style.color = "black";
        loginLink.style.display = "inline-block";
        loginLink.style.padding = "10px 12px";
        loginLink.style.textDecoration = "none";
        loginLink.style.cursor = "pointer";
        loginLink.style.flex = "initial";
    }

    function showModal(title, bodyHtml) {
        closeModal();

        var overlay = document.createElement("div");
        overlay.className = "js-modal-overlay";
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.background = "rgba(0, 0, 0, 0.35)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "1000";

        var modal = document.createElement("div");
        modal.style.width = "min(420px, 92vw)";
        modal.style.maxHeight = "80vh";
        modal.style.overflow = "auto";
        modal.style.background = "white";
        modal.style.borderRadius = "15px";
        modal.style.padding = "20px";
        modal.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
        modal.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">' +
            '<h3 style="margin:0;">' + escapeHtml(title) + '</h3>' +
            '<button class="js-modal-close" style="border:none;background:#f2f2f2;border-radius:8px;padding:6px 10px;cursor:pointer;">Close</button>' +
            '</div><div style="margin-top:16px;">' + bodyHtml + '</div>';

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) {
                closeModal();
            }
        });

        modal.querySelector(".js-modal-close").addEventListener("click", closeModal);
    }

    function closeModal() {
        var existing = document.querySelector(".js-modal-overlay");
        if (existing) {
            existing.remove();
        }
    }

    function showToast(message) {
        var toast = document.querySelector(".js-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "js-toast";
            toast.style.position = "fixed";
            toast.style.left = "50%";
            toast.style.bottom = "24px";
            toast.style.transform = "translateX(-50%)";
            toast.style.background = "#222";
            toast.style.color = "white";
            toast.style.padding = "10px 16px";
            toast.style.borderRadius = "8px";
            toast.style.zIndex = "1001";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        clearTimeout(toast.timer);
        toast.timer = setTimeout(function () {
            toast.remove();
        }, 1800);
    }

    function getCartTotals() {
        return Object.keys(cart).reduce(function (totals, id) {
            totals.quantity += cart[id].quantity;
            totals.amount += cart[id].quantity * cart[id].price;
            return totals;
        }, { quantity: 0, amount: 0 });
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
