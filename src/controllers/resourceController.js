const Resource = require("../models/Resource");

const getResourcesByModule = async (req, res, next) => {
    try {
        const { moduleId } = req.params;

        const resources = await Resource.find({
            module: moduleId
        });

        res.status(200).json(resources);
    } catch (error) {
        next(error);
    }
};

module.exports = { getResourcesByModule };