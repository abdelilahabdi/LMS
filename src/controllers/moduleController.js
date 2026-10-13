const Module = require("../models/Module");
const Course = require("../models/Course");

const getModulesByCourse = async (req, res, next) =>
{
    try
    {
        const { courseId } = req.params;

        const modules = await Module.find({
            course: courseId
        });

        res.status(200).json(modules);
    }
    catch (error)
    {
        next(error);
    }
};

const create_module = async (req, res, next) =>
{
    try
    {
        const { title, description, order, course } = req.body;

        const existing_course = await Course.findById(course);

        if (!existing_course)
        {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        const new_module = await Module.create({
            title,
            description,
            order,
            course
        });

        res.status(201).json(new_module);
    }
    catch (error) { next(error)}
};

module.exports = {
    getModulesByCourse,
    create_module
};