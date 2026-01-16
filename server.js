const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

//MIDDLEWARES
app.use(cors()); //Autorise le frontend à appeler l'API
app.use(express.json()); // Pour lire le JSON envoyé par le client

// 1. CONNEXION À MONGODB
mongoose.connect('mongodb://127.0.0.1:27017/marketplace_db')
    .then(() => console.log("Connecté à MongoDB !"))
    .catch(err => console.log("Erreur de connexion :", err));


// ----------------------------------------------------------------------------------

// 2. CRÉATION DES SCHÉMA ET DES MODÈLE
// C'est ici qu'on définit la structure de nos documents

// SHEMA ET MODELE DES CATEGORIES
const categorieSchema = new mongoose.Schema({
    nom: {
        type: String, 
        required: true
    },
});

const Categorie = mongoose.model('categories', categorieSchema);

// SHEMA ET MODELE DES PRODUITS
const productSchema = new mongoose.Schema({
    nom: {
        type: String, 
        required: true
    },
    prix: {
        type: Number,
        min: 0, 
        required: true
    },
    stock: {
        type: Number, 
        required: true,
        min: 0
    },
    categorie: {
        type: mongoose.Types.ObjectId, 
        ref: 'categories'
    }
});

const Product = mongoose.model('products', productSchema);

// SHEMA ET MODELE DES UTILISATEURS
const userSchema = new mongoose.Schema({
    nom: {
        type: String, 
        required: true
    },
    email: {
        type: String, 
        required: true,
        unique: true
    },
    role: {
        type: String, 
        default: 'client',
        enum: ['client', 'admin']
    }
});

const User = mongoose.model('users', userSchema);

// SHEMA ET MODELE DES AVIS
const reviewSchema = new mongoose.Schema({
    commentaire: {
        type: String, 
        required: true
    },
    note: {
        type: Number, 
        required: true,
        min: 1,
        max: 5
    },
    produit: {
        type: mongoose.Types.ObjectId, 
        ref: 'products'
    },
    auteur: {
        type: mongoose.Types.ObjectId, 
        ref: 'users'
    }
});

const Review = mongoose.model('reviews', reviewSchema);


// ----------------------------------------------------------------------------------


// 3. LES ROUTES (Manipuler la base de données)

// --- CRÉER (POST) ---

// CREATION D'UNE CATEGORIE
app.post('/api/categories', async (req, res) => {
    try {
        const newReview = new Categorie(req.body);
        const savedReview = await newReview.save();
        res.status(201).json(savedReview);
    } catch (err) {
        res.status(400).json({ error: "Impossible de créer la categorie" });
    }
});

// CREATION D'UN PRODUIT
app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        if (newProduct.prix > 0 ){
            const savedProduct = await newProduct.save();            
            res.status(201).json(savedProduct);
        } else {
            res.status(400).json({ error: "Le prix doit être superieur à zero" });
        }
            
    } catch (err) {
        res.status(400).json({ error: "Impossible de créer le produit" });
    }
});

// CREATION D'UN UTILISATEUR
app.post('/api/users', async (req, res) => {
    try {
        const newUser = new User(req.body);
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (err) {
        res.status(400).json({ error: "Impossible de créer l'utilisateur" });
    }
});

// CREATION D'UN AVIS
app.post('/api/reviews', async (req, res) => {
    try {
        const newReview = new Review(req.body);
        const savedReview = await newReview.save();
        res.status(201).json(savedReview);
    } catch (err) {
        res.status(400).json({ error: "Impossible de créer l'avis" });
    }
});


// --- LIRE TOUT (GET) ---

// LECTURE DES PRODUITS
app.get('/api/products', async (req, res) => {
    const products = await Product.find().populate('categorie');
    res.json(products);
});

// LECTURE DES AVIS
app.get('/api/reviews', async (req, res) => {
    const reviews = await Review.find()
        .populate('auteur', 'nom')
        .populate({
            path: 'produit',
            populate: { path: 'categorie' }
        });
    res.json(reviews);
});

// LECTURE DES CATEGORIES
app.get('/api/categories', async (req, res) => {
    const cat = await Categorie.find();
    res.json(cat);
});

// LECTURE DES UTILISATEURS
app.get('/api/users', async (req, res) => {
    const user = await User.find();
    res.json(user);
});

// --- SUPPRIMER (DELETE) ---

// SUPRIMER UN PRODUIT (ET LES AVIS LIES)
app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        const reviews = await Review.find({produit: req.params.id})
        console.log(reviews);
        for (let i=0; i<reviews.length; i++) {
            const r = reviews[i];
            console.log({ current: r, id: r._id});
            await Review.findByIdAndDelete(r._id);
        }
        res.json({ message: "Produit supprimé avec succès" });
    } catch (err) {
        res.status(400).json({ error: "Impossible de suprimer le produit" });
    }    
});


// ----------------------------------------------------------------------------------


// 4. DÉMARRAGE DU SERVEUR
app.listen(3000, () => console.log("Serveur sur le port 3000"));