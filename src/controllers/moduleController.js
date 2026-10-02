const Module = require("../models/Module");

const getModulesByCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        const modules = await Module.find({
            course: courseId
        });

        res.status(200).json(modules);
    } catch (error) {
        next(error);
    }
};

module.exports = { getModulesByCourse };