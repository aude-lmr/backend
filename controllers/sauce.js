const Item = require("../models/Item");
const multer = require("multer");
const fs = require("fs");

// Création d'une sauce
exports.createItem = (req, res, next) => {
  const itemObject = JSON.parse(req.body.sauce);

  delete itemObject.userId;

  const item = new Item({
    userId: req.auth.userId,
    name: itemObject.name,
    manufacturer: itemObject.manufacturer,
    description: itemObject.description,
    mainPepper: itemObject.mainPepper,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
    heat: itemObject.heat,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  });

  item
    .save()
    .then(() => {
      res.status(201).json({ message: "Sauce enregistré !" });
    })
    .catch((error) => {
      console.log(error);
      res.status(400).json({ error });
    });
};

// Affichage d'une sauce
exports.getOneItem = (req, res, next) => {
  Item.findOne({ _id: req.params.id })
    .then((sauce) => res.status(200).json(sauce))
    .catch((error) => res.status(404).json({ error }));
};

// Modification d'une sauce
exports.updateItem = (req, res, next) => {
  const itemObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete itemObject._userId;
  Item.findOne({ _id: req.params.id })
    .then((item) => {
      if (item.userId != req.auth.userId) {
        res.status(403).json({ message: "Not authorized" });
      } else {
        Item.updateOne(
          { _id: req.params.id },
          { ...itemObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// Supprimer une sauce
exports.deleteItem = (req, res, next) => {
  Item.findOne({ _id: req.params.id })
    .then((item) => {
      if (item.userId != req.auth.userId) {
        res.status(401).json({ message: "Non-autorisé" });
      } else {
        const filename = item.imageUrl.split("/images")[1];
        fs.unlink(`images/${filename}`, () => {
          Item.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Sauce supprimée !" });
            })
            .catch((error) => {
              res.status(401).json({ error });
            });
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

// Afficher toutes les sauces
exports.getAllItems = (req, res, next) => {
  Item.find()
    .then((items) => res.status(200).json(items))
    .catch((error) => res.status(400).json({ error }));
};

// Fonctionnalité like/dislike
exports.usersLikes = (req, res, next) => {
  let like = req.body.like;
  const user = req.body.userId;

  Item.updateOne({ id: req.params._id })
    .then((item) => {
      // L'utilisateur met 1 like
      if (like === 1) {
        Item.updateOne(
          { _id: req.params.id },
          {
            $addToSet: { usersLiked: user },
            $inc: { likes: +1 },
          }
        )
          .then(() => {
            res.status(200).json({ message: "Liked" });
          })
          .catch((error) => {
            console.log(error);
            res.status(400).json({ error });
          });
      } // L'utilisateur met 1 dislike
      else if (like === -1) {
        Item.updateOne(
          { _id: req.params.id },
          {
            $addToSet: { usersDisliked: user },
            $inc: { dislikes: +1 },
          }
        )
          .then(() => {
            res.status(200).json({ message: "Disliked" });
          })
          .catch((error) => {
            res.status(400).json({ error });
          });
      } // L'utilisateur annule son like/dislike
      else if (like === 0) {
        Item.findOne({ _id: req.params.id })
          .then((item) => {
            if (item.usersLiked.includes(user)) {
              Item.updateOne(
                { _id: req.params.id },
                {
                  $pull: { usersLiked: user },
                  $inc: { likes: -1 },
                }
              )
                .then(() => {
                  res.status(200).json({ message: "Unliked" });
                })
                .catch((error) => {
                  res.status(400).json({ error });
                });
            } else if (item.usersDisliked.includes(user)) {
              Item.updateOne(
                { _id: req.params.id },
                {
                  $pull: { usersDisliked: user },
                  $inc: { dislikes: -1 },
                }
              )
                .then(() => {
                  res.status(200).json({ message: "Dislike canceled" });
                })
                .catch((error) => {
                  res.status(400).json({ error });
                });
            }
          })
          .catch((error) => {
            res.status(401).json({ error });
          });
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};
