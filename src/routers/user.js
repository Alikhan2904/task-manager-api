const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const router = new express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');


router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    } catch (error) {
        res.status(400).send(error);
    }

});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {

    // List of all parameters user is trying to update
    const updates = Object.keys(req.body);
    
    // List of all valid parameters that user can update
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    
    // Checking if user is trying to update a property which is not allowed
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });

    if (!isValidOperation) {
        return res.status(400).send({ error : 'Invalid Updates!' })
    }

    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });

        await req.user.save();

        // const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true } );
        res.send(req.user);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    
    try {
        await req.user.remove();
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }

});

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('File type must be JPG or JPEG or PNG'));
        }

        cb(undefined, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    
    await req.user.save();
    res.send();

}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
    const _id = req.params.id;

    try {
        const user = await User.findById(_id);

        if(!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png');  // Sets which type of content will be sent
        res.send(user.avatar);

    } catch (error) {
        res.status(404).send();
    }
});

module.exports = router;














// router.get('/users/:id', async (req, res) => {
//     const _id = req.params.id;

//     try {
//         const user = await User.findById(_id);
//         if (!user) { 
//             return res.status(404).send();
//         }
//         res.send(user);   
//     } catch (error) {
//         res.status(500).send(error);   
//     }

// });

// router.delete('/users/:id', auth, async (req, res) => {
//     const _id = req.params.id;

//     try {
//         const user = await User.findByIdAndDelete(_id);
//         if (!user) {
//             return res.status(404).send();
//         }
//         res.send(user);
//     } catch (error) {
//         res.status(500).send(error);
//     }
// });