const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/task');

router.post('/tasks', auth, async (req, res) => {

    const task = new Task({
        ...req.body,
        owner: req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);        
    } catch (error) {
        res.status(400).send(error);        
    }

});

// GET /tasks/completed=true
// GET /tasks/limit=10&skip=0
// GET /tasks/sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {

    const match = {};
    const sort = {};

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 
    }
    console.log(sort);
    
    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();

        res.send(req.user.tasks);
        
        // const tasks = await Task.find({ owner: req.user._id });        
        // res.send(tasks);

    } catch (error) {
        res.status(500).send(error);    
    }
});

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        
        const task = await Task.findOne({ _id, owner: req.user._id });
        
        if (!task) {
            return res.status(404).send();
        }

        res.send(task);        
    } catch (error) {
        res.status(500).send(error);    
    }

});

router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    
    // List of all parameters user is trying to update
    const updates = Object.keys(req.body);

    // List of all valid parameters that user can update
    const allowedUpdates = ['description', 'completed'];
    
    // Checking if user is trying to update a property which is not allowed
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Updates!' });
    }

    try {
        const task = await Task.findOne({ _id, owner: req.user._id });
        // const task = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true });
        if (!task) {
            return res.status(404).send();
        }
        
        updates.forEach((update) => {
            task[update] = req.body[update];
        });
        await task.save();
        return res.send(task);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOneAndDelete({ _id , owner: req.user._id});
        
        if (!task) {
            return res.status(404).send();
        }
        
        res.send(task);

    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;









