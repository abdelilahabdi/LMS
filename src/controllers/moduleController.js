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

        return res.status(200).json(modules);
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

        return res.status(201).json(new_module);
    }
    catch (error)
    {
        next(error);
    }
};

const get_all_modules = async (req, res, next) =>
{
    try
    {
        const modules = await Module.find();

        return res.status(200).json(modules);
    }
    catch (error)
    {
        next(error);
    }
};

const get_module_by_id = async (req, res, next) =>
{
    try
    {
        const { id } = req.params;

        const module = await Module.findById(id);

        if (!module)
        {
            return res.status(404).json({
                message: "Module not found"
            });
        }

        return res.status(200).json(module);
    }
    catch (error)
    {
        next(error);
    }
};

const update_module = async (req, res, next) =>
{
    try
    {
        const { id } = req.params;
        const { title, description, order } = req.body;

        const updated_module = await Module.findByIdAndUpdate(
            id,
            {
                title,
                description,
                order
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updated_module)
        {
            return res.status(404).json({
                message: "Module not found"
            });
        }

        return res.status(200).json(updated_module);
    }
    catch (error)
    {
        next(error);
    }
};

const delete_module = async (req, res, next) =>
{
    try
    {
        const { id } = req.params;

        const deleted_module = await Module.findByIdAndDelete(id);

        if (!deleted_module)
        {
            return res.status(404).json({
                message: "Module not found"
            });
        }

        return res.status(200).json({
            message: "Module deleted successfully",
            module: deleted_module
        });
    }
    catch (error)
    {
        next(error);
    }
};

module.exports = {
    getModulesByCourse,
    create_module,
    get_all_modules,
    get_module_by_id,
    update_module,
    delete_module
};