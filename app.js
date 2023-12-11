const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const fileupload = require('express-fileupload');
const mysql = require('mysql');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');


app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");


const sessionConfig = {
    secret: 'askfnkasfnkasn',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        path: '/',
        maxAge: 1000 * 60 * 60 * 24
    }
};
app.use(expressSession(sessionConfig));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileupload());

/** 
 * MySQL Connection
 */
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Jaswant0712@',
    database: 'amazon'
}
const connection = mysql.createConnection(dbConfig);
//check database connection
connection.connect(function (error) {
    if (error) {
        console.log("Unable to connect with Database", error);
    } else {
        console.log("Database Connected");
    }
})

app.get("/admin", function (req, res) {
    let data = {
        title: "Admin Panel: Dashboard",
        pageName: "dashboard"
    }
    res.render("admin/template", data);
});


app.get("/admin/create-product", async function (req, res) {
    let data = {
        title: "Admin : Add Product",
        pageName: "create-product"
    };
    const categories = await getAllCategories();
    data.categories = categories;
    res.render("admin/template", data);
});

/**
 * To insert product data in Database  
 */
app.post('/admin/create-product', async function (req, res) {
    try {
        console.log(req.body);
        console.log(req.files);

        if (req.files && req.files.productImages) {
            console.log("req.files.productImages.length", req.files.productImages.length);
            const allImages = req.files.productImages;
            let imageNames = [];
            if (allImages && allImages.length > 1) {
                for (const singleImage of allImages) {
                    console.log("singleImage", singleImage);
                    let imageNewName = await uploadImage(singleImage, 'product');
                    imageNames.push(imageNewName);
                }
            } else {
                let imageNewName = await uploadImage(allImages, 'product');
                imageNames.push(imageNewName);
            }
            console.log("imageNames", imageNames);
            let product = {
                title: req.body.title,
                description: req.body.description,
                price: req.body.price,
                quantity: req.body.quantity,
                categoryId: req.body.category,
                images: imageNames.toString(','),
            }
            console.log("product", product);
            await insertProduct(product);
            res.redirect('/admin/products');
        }
    } catch (error) {
        console.log("Error::: /admin/create-product", error);
    }
});

app.get("/admin/products", async function (req, res) {
    let data = {
        title: "Admin : Product List",
        pageName: "product-list"
    }
    data.products = await getAllProducts();
    console.log("data", data);
    res.render("admin/template", data);
});



app.get("/admin/create-category", function (req, res) {
    let data = {
        title: "Admin : Add Category",
        pageName: "create-category"
    }
    res.render("admin/template", data);
});

app.get("/admin/categories", async function (req, res) {
    let data = {
        title: "Admin :Category List",
        pageName: "category-list"
    }
    //get all categories
    let categories = await getAllCategories();
    data.categories = categories;
    console.log("categories", categories);
    res.render("admin/template", data);
});



/** 
 * Create Category & Save in Databse
 */
app.post('/create-category', async function (req, res) {
    try {
        console.log("req.body", req.body);
        console.log("req.files", req.files);
        const imgNewName = await uploadImage(req.files.catImage);
        let catData = {
            title: req.body.title,
            image: imgNewName,
            parent: 0
        };
        await insertCategory(catData);
        console.log("imgNewName", imgNewName);
        res.redirect('/admin/categories');
    } catch (error) {
        console.log("Create Category :::", error);
    }
});

/* app.post('/create-product', function(req, res){
    console.log("")
}); */

/** 
 * Insert product record in database
 */
async function insertProduct(data) {
    return new Promise(function (resolve, reject) {
        let inserCat = `INSERT INTO products(title, description, price, quantity, images, category_id) VALUES('${data.title}', '${data.description}', '${data.price}', '${data.quantity}', '${data.images}', '${data.categoryId}')`;
        connection.query(inserCat, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

/** 
 * Insert category record in database
 */
async function insertCategory(data) {
    return new Promise(function (resolve, reject) {
        let inserCat = `INSERT INTO category(title, image, parent_id) VALUES('${data.title}', '${data.image}', '${data.parent}')`;
        connection.query(inserCat, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

/** 
 * To get all Products
 */
async function getAllProducts() {
    return new Promise(function (resolve, reject) {
        let getCat = `SELECT products.*, category.title as cat_title FROM products INNER JOIN category ON products.category_id=category.id`;
        connection.query(getCat, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

/** 
 * To get all categories
 */
async function getAllCategories() {
    return new Promise(function (resolve, reject) {
        let getCat = `SELECT * FROM category`;
        connection.query(getCat, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

/** 
 * upload image in directory
 */
async function uploadImage(imgData, path = 'category') {
    return new Promise(function (resolve, reject) {
        console.log("imgData", imgData);
        const imgExt = imgData.name.split('.').splice(-1);;
        console.log("imgExt", imgExt);
        let currentDate = new Date();
        let imgNewName = `${currentDate.getTime()}__${Math.random(1111, 999999) * 1000}__.${imgExt}`;
        console.log("imgNewName", imgNewName);
        const uploadPath = __dirname + `/public/image/${path}/` + imgNewName;
        imgData.mv(uploadPath, function (error) {
            if (error) {
                reject(error);
            } else {
                resolve(imgNewName);
            }
        });
    });
}

/** 
 * START: USER UI
 */
app.get('/login', function (req, res) {
    let data = {
        title: "Login Portal",
        pageName: "login",
        status: '',
        message: '',
        isUserLoggedIn: false,
    }
    if (req.cookies && req.cookies.userId) {
        data.isUserLoggedIn = true;
    }
    if (req.session.status && req.session.message) {
        data.status = req.session.status;
        data.message = req.session.message;
        delete req.session.status, req.session.message;
    }
    res.render("user/template", data);
});

app.get("/", async function (req, res) {
    let data = {
        title: "Welcome to: E-way",
        pageName: "dashboard",
        isUserLoggedIn: false,
    }
    if (req.cookies && req.cookies.userId) {
        data.isUserLoggedIn = true;
    }
    const products = await getAllProducts();
    data.products = products;
    res.render("user/template", data);
});

app.get("/create-order", async function (req, res) {
    let data = {
        title: "Welcome to: E-way",
        pageName: "create-order",
        items: [],
        isUserLoggedIn: false,
    }
    if (req.cookies && req.cookies.userId) {
        data.isUserLoggedIn = true;
    }
    if (req.cookies && req.cookies.cartItems) {
        const prodIds = req.cookies.cartItems;
        let ids = prodIds.toString(',');
        const products = await getProductByIds(ids);
        data.items = products;
    }
    res.render("user/template", data);
});

/* if (req.cookies && req.cookies.cartItems) {
        allProducts = req.cookies.cartItems; //get cookie
        console.log("req.cookies.cartItems", req.cookies.cartItems);
    } */
app.get('/add-to-cart', function (req, res) {
    console.log("Add To cart Executed");
    const productId = req.query.productId;
    console.log("productId", productId);
    console.log("req.cookies", req.cookies);
    console.log("req.cookies.myFirstCookie", req.cookies.myFirstCookie);
    let allProducts = [];
    if (req.cookies && req.cookies.cartItems) {
        allProducts = req.cookies.cartItems;
    }
    allProducts.push(productId);
    console.log("allProducts", allProducts);
    allProducts = Array.from(new Set(allProducts));
    res.cookie('cartItems', allProducts); //set cookie
    res.redirect('/');
});

app.get("/cart", async function (req, res) {
    let data = {
        title: "Shopping : Cart",
        pageName: "cart",
        items: [],
        isUserLoggedIn: false,
    };
    if (req.cookies && req.cookies.userId) {
        data.isUserLoggedIn = true;
    }
    if (req.cookies && req.cookies.cartItems) {
        const prodIds = req.cookies.cartItems;
        let ids = prodIds.toString(',');
        const products = await getProductByIds(ids);
        data.items = products;
    }
    res.render("user/template", data);
});

app.post("/create-order", async function (req, res) {
    console.log("req.body", req.body);
    if (req.cookies && req.cookies.userId) {
        const userId = req.cookies.userId;
        let order = {
            userId: userId,
            fullName: req.body.fullName,
            email: req.body.email,
            contact: req.body.contact,
            shippingAddress: req.body.shippingAddress,
            shippingPincode: req.body.shippingPincode,
            billingAddress: req.body.billingAddress,
            billingPincode: req.body.billingPincode,
            paymentMethod: req.body.paymentMethod,
            grandTotal: req.body.grandTotal
        };
        let productItems = [];
        if (req.body.productId && req.body.quantity) {
            let proIds = req.body.productId;
            let prodQuantity = req.body.quantity;
            let prodPrice = req.body.price;
            console.log("proIds", proIds);
            console.log("prodQuantity", prodQuantity);
            for (let i = 0; i < proIds.length; i++) {
                let item = {
                    productId: proIds[i],
                    quantity: prodQuantity[i],
                    price: prodPrice[i],
                }
                productItems.push(item);
            }
            console.log("productItems", productItems);
        }
        order.productItems = JSON.stringify(productItems);
        console.log("order", order);
        await generateOrder(order);
        res.redirect('/');
    } else {
        req.session.status = 'Error';
        req.session.message = 'Session Expired';
        res.redirect('/login');
    }
});

app.post("/authentication", async function (req, res) {
    try {
        console.log("req.body", req.body);
        const email = req.body.username;
        const password = req.body.password;
        let user = await getUserByEmail(email);
        if (user) {
            console.log("User Data Found");
            if (user.password == password) {
                res.cookie('userId', user.id);
                res.redirect('/');
            } else {
                req.session.status = 'Error';
                req.session.message = 'Incorrect Password';
                res.redirect('/login');
            }
        } else {
            //invliad details
            console.log("Data not found");
            req.session.status = 'Error';
            req.session.message = 'Invalid Email Address';
            res.redirect('/login');
        }
        console.log("user", user);

    } catch (error) {
        console.log("error", error);
    }
});

app.get("/orders", async function (req, res) {
    let data = {
        title: "Order",
        pageName: "order",
        isUserLoggedIn: false,
        orders: [],
    }
    if (req.cookies && req.cookies.userId) {
        data.isUserLoggedIn = true;
        const userId = req.cookies.userId;
        data.orders = await getOrderByUserId(userId);
    }
    console.log("data", data);
    res.render("user/template", data);
});

app.get("/register", function (req, res) {
    let data = {
        title: "Register",
        pageName: "signup",
        isUserLoggedIn: false,
    }
    if (req.cookies && req.cookies.userId) {
        data.isUserLoggedIn = true;
    }
    res.render("user/template", data);
});

app.post("/register", async function (req, res) {
    try {
        console.log("req.body", req.body);
        let user = {
            firstName: req.body.firstNames,
            lastName: req.body.lastName,
            contact: req.body.contact,
            email: req.body.email,
            password: req.body.password,
            gender: req.body.gender,
            address: req.body.Address,
        };
        await insertUser(user);
        res.redirect('/login');
    } catch (error) {
        console.log("Register User Error :::", error);
    }
});

app.get('/getProductInfo', async function (req, res) {
    try {
        console.log("Url : getProductInfo :: executed", req.query);
        let prodIds = req.query.prodIds;
        console.log("prodIds", prodIds);
        let ids = prodIds.toString();
        console.log("ids", ids);
        let products = await getProductByIds(ids);
        console.log("products", products);
        let response = {
            status: "Success",
            items: products
        };
        return res.json(response);
    } catch (error) {
        console.log("Get Product Info Error :::", error);
    }
});

/** 
 * Single Product Page
 */
app.get('/single-product/:productId', async function (req, res) {
    try {
        let data = {
            title: "Product : Detail",
            pageName: "single-product",
            isUserLoggedIn: false,
        }
        console.log("req.params", req.params);
        const productId = req.params.productId;
        const product = await getSinlgeProductById(productId);
        data.product = product;
        if (req.cookies && req.cookies.userId) {
            data.isUserLoggedIn = true;
        }
        res.render("user/template", data);
    } catch (error) {
        console.log("Error :: Single Product Page ::: ", error);
    }
});

/** 
 * END: USER UI
 */

/* Start : all functions */
async function getSinlgeProductById(productId) {
    return new Promise(function (resolve, reject) {
        let getCat = `SELECT * FROM products WHERE id='${productId}'`;
        connection.query(getCat, function (error, result) {
            if (error) {
                reject(error);
            } else {
                if (result && result.length > 0) {
                    resolve(result[0]);
                } else {
                    let response = {
                        status: 'Error',
                        message: 'Product Does not exist',
                    }
                    reject(response);
                }
            }
        });
    });
}

async function getProductByIds(productIds) {
    return new Promise(function (resolve, reject) {
        let getCat = `SELECT * FROM products WHERE id IN(${productIds})`;
        connection.query(getCat, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

async function getUserByEmail(email) {
    return new Promise(function (resolve, reject) {
        let getCat = `SELECT * FROM users WHERE email='${email}'`;
        console.log("getCat", getCat);
        connection.query(getCat, function (error, result) {
            if (error) {
                reject(error);
            } else {
                let userData = false;
                if (result && result.length > 0) {
                    userData = result[0];
                }
                resolve(userData);
            }
        });
    });
}

async function generateOrder(order) {
    return new Promise(function (resolve, reject) {
        let createOrder = `INSERT INTO orders(full_name, email, contact, shipping_address, shipping_pincode, billing_address, billing_pincode, payment_method, product_items, user_id, grandTotal) VALUES('${order.fullName}', '${order.email}', '${order.contact}', '${order.shippingAddress}', '${order.shippingPincode}', '${order.billingAddress}', '${order.billingPincode}', '${order.paymentMethod}', '${order.productItems}', '${order.userId}', '${order.grandTotal}')`;
        connection.query(createOrder, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(true);
            }
        });
    });
}

async function insertUser(user) {
    return new Promise(function (resolve, reject) {
        let createUser = `INSERT INTO users(first_name, last_name, email, password, gender, contact, address) VALUES('${user.firstName}', '${user.lastName}', '${user.email}', '${user.password}', '${user.gender}', '${user.contact}', '${user.address}')`;
        connection.query(createUser, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(true);
            }
        });
    });
}
app.get('/logout', function (req, res) {
    res.clearCookie('userId');
    res.redirect('/login');
});

async function getOrderByUserId(userId) {
    return new Promise(function (resolve, reject) {
        let createUser = `SELECT * FROM orders WHERE user_id='${userId}'`;
        connection.query(createUser, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}
/* End : all functions */

const port = 4005;
app.listen(port, function () {
    console.log(`server started at PORT::: ${port}`);
});