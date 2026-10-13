const fs = require("fs/promises");
const path = require("path");

const Resource = require("../models/Resource");
const Module = require("../models/Module");
const { UPLOAD_DIR } = require("../middlewares/resourceUpload");

const getResourcesByModule = async (req, res, next) => {
    try {
        const { moduleId } = req.params;

        const resources = await Resource.find({
            module: moduleId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: resources.length,
            data: resources
        });
    } catch (error) {
        next(error);
    }
};

const validateFileSignature = async (filePath, extension) => {
    const handle = await fs.open(filePath, "r");

    try {
        const buffer = Buffer.alloc(12);
        const { bytesRead } = await handle.read(buffer, 0, 12, 0);

        if (extension === ".pdf") {
            return buffer.subarray(0, 5).toString() === "%PDF-";
        }

        if (extension === ".mp4") {
            return (
                bytesRead >= 12 &&
                buffer.toString("ascii", 4, 8) === "ftyp"
            );
        }

        if (extension === ".webm") {
            return (
                bytesRead >= 4 &&
                buffer[0] === 0x1A &&
                buffer[1] === 0x45 &&
                buffer[2] === 0xDF &&
                buffer[3] === 0xA3
            );
        }

        return false;
    } finally {
        await handle.close();
    }
};

const uploadResource = async (req, res, next) => {
    let savedFilePath = null;

    try {
        const { moduleId } = req.params;
        const { title } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a file."
            });
        }

        savedFilePath = path.join(UPLOAD_DIR, req.file.filename);

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Resource title is required."
            });
        }

        if (!/^[0-9a-fA-F]{24}$/.test(moduleId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid module ID."
            });
        }

        const moduleExists = await Module.exists({
            _id: moduleId
        });

        if (!moduleExists) {
            return res.status(404).json({
                success: false,
                message: "Module not found."
            });
        }

        const extension = path.extname(req.file.originalname).toLowerCase();

        const validSignature = await validateFileSignature(
            savedFilePath,
            extension
        );

        if (!validSignature) {
            await fs.unlink(savedFilePath);
            savedFilePath = null;

            return res.status(400).json({
                success: false,
                message: "The file content does not match its extension."
            });
        }

        const resourceType = extension === ".pdf" ? "pdf" : "video";

        const resource = await Resource.create({
            title: title.trim(),
            type: resourceType,
            url: `/uploads/resources/${req.file.filename}`,
            module: moduleId
        });

        savedFilePath = null;

        return res.status(201).json({
            success: true,
            message: "Resource uploaded successfully.",
            data: resource
        });
    } catch (error) {
        if (savedFilePath) {
            await fs.unlink(savedFilePath).catch(() => { });
        }

        next(error);
    }
};

module.exports = {
    getResourcesByModule,
    uploadResource
};