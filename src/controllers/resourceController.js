const fs = require("fs/promises");
const path = require("path");

const Resource = require("../models/Resource");
const Module = require("../models/Module");
const { UPLOAD_DIR } = require("../middlewares/resourceUpload");
const { drive } = require("../config/googleDrive");

// Constants
const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const ALLOWED_RESOURCE_TYPES = ["video", "pdf", "article", "exercise", "link"];
const VALID_EXTENSIONS = [".pdf", ".mp4", ".webm"];

// Helper functions
const isValidMongoId = (id) => MONGO_ID_REGEX.test(id);

const validateFileSignature = async (file_path, extension) =>
{
    if (!VALID_EXTENSIONS.includes(extension))
    {
        return false;
    }

    const handle = await fs.open(file_path, "r");

    try
    {
        const buffer = Buffer.alloc(12);
        const { bytesRead } = await handle.read(buffer, 0, 12, 0);

        const signatures = {
            ".pdf": () => buffer.subarray(0, 5).toString() === "%PDF-",
            ".mp4": () => bytesRead >= 12 && buffer.toString("ascii", 4, 8) === "ftyp",
            ".webm": () => bytesRead >= 4 && 
                buffer[0] === 0x1A && buffer[1] === 0x45 && 
                buffer[2] === 0xDF && buffer[3] === 0xA3
        };

        return (signatures[extension] || (() => false))();
    }
    finally
    {
        await handle.close();
    }
};

// Controllers
const getResourcesByModule = async (req, res, next) =>
{
    try
    {
        const { moduleId } = req.params;

        if (!isValidMongoId(moduleId))
        {
            return res.status(400).json({
                success: false,
                message: "Invalid module ID."
            });
        }

        const module_exists = await Module.exists({ _id: moduleId });

        if (!module_exists)
        {
            return res.status(404).json({
                success: false,
                message: "Module not found."
            });
        }

        const resources = await Resource.find({
            module: moduleId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: resources.length,
            data: resources
        });
    }
    catch (error)
    {
        next(error);
    }
};

const uploadResource = async (req, res, next) =>
{
    let saved_file_path = null;
    let uploaded_file_id = null;

    try
    {
        const { moduleId } = req.params;
        const { title } = req.body;

        if (!isValidMongoId(moduleId))
        {
            return res.status(400).json({
                success: false,
                message: "Invalid module ID."
            });
        }

        if (!title || !title.trim())
        {
            return res.status(400).json({
                success: false,
                message: "Resource title is required."
            });
        }

        if (!req.file)
        {
            return res.status(400).json({
                success: false,
                message: "Please upload a file."
            });
        }

        const extension = path.extname(req.file.originalname).toLowerCase();

        if (!VALID_EXTENSIONS.includes(extension))
        {
            return res.status(400).json({
                success: false,
                message: "Only PDF, MP4 and WebM files are allowed."
            });
        }

        const module_exists = await Module.exists({ _id: moduleId });

        if (!module_exists)
        {
            return res.status(404).json({
                success: false,
                message: "Module not found."
            });
        }

        saved_file_path = path.join(UPLOAD_DIR, req.file.filename);

        const valid_signature = await validateFileSignature(
            saved_file_path,
            extension
        );

        if (!valid_signature)
        {
            await fs.unlink(saved_file_path).catch(() => {});
            saved_file_path = null;

            return res.status(400).json({
                success: false,
                message: "The file content does not match its extension."
            });
        }

        if (!process.env.GOOGLE_DRIVE_FOLDER_ID)
        {
            throw new Error("Google Drive folder ID is missing.");
        }

        const drive_response = await drive.files.create({
            requestBody: {
                name: req.file.originalname,
                mimeType: req.file.mimetype,
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
            },
            media: {
                mimeType: req.file.mimetype,
                body: require("fs").createReadStream(saved_file_path)
            },
            fields: "id,name,webViewLink"
        });

        uploaded_file_id = drive_response.data.id;

        const file_url = drive_response.data.webViewLink ||
            `https://drive.google.com/file/d/${uploaded_file_id}/view`;

        const resource_type = extension === ".pdf" ? "pdf" : "video";

        const resource = await Resource.create({
            title: title.trim(),
            type: resource_type,
            url: file_url,
            fileId: uploaded_file_id,
            module: moduleId
        });

        await fs.unlink(saved_file_path);
        saved_file_path = null;

        return res.status(201).json({
            success: true,
            message: "Resource uploaded successfully to Google Drive.",
            data: resource
        });
    }
    catch (error)
    {
        if (uploaded_file_id)
        {
            await drive.files.delete({
                fileId: uploaded_file_id
            }).catch(() => {});
        }

        if (saved_file_path)
        {
            await fs.unlink(saved_file_path).catch(() => {});
        }

        next(error);
    }
};

const getResourceById = async (req, res, next) =>
{
    try
    {
        const { id } = req.params;

        if (!isValidMongoId(id))
        {
            return res.status(400).json({
                success: false,
                message: "Invalid resource ID."
            });
        }

        const resource = await Resource.findById(id);

        if (!resource)
        {
            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: resource
        });
    }
    catch (error)
    {
        next(error);
    }
};

const updateResource = async (req, res, next) =>
{
    try
    {
        const { id } = req.params;
        const { title, type, url } = req.body;

        if (!isValidMongoId(id))
        {
            return res.status(400).json({
                success: false,
                message: "Invalid resource ID."
            });
        }

        const resource = await Resource.findById(id);

        if (!resource)
        {
            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });
        }

        if (title !== undefined)
        {
            const trimmed = title.trim();
            if (!trimmed)
            {
                return res.status(400).json({
                    success: false,
                    message: "Resource title cannot be empty."
                });
            }
            resource.title = trimmed;
        }

        if (type !== undefined)
        {
            if (!ALLOWED_RESOURCE_TYPES.includes(type))
            {
                return res.status(400).json({
                    success: false,
                    message: "Invalid resource type."
                });
            }
            resource.type = type;
        }

        if (url !== undefined)
        {
            const trimmed = url.trim();
            if (!trimmed)
            {
                return res.status(400).json({
                    success: false,
                    message: "Resource URL cannot be empty."
                });
            }
            resource.url = trimmed;
        }

        await resource.save();

        return res.status(200).json({
            success: true,
            message: "Resource updated successfully.",
            data: resource
        });
    }
    catch (error)
    {
        next(error);
    }
};

const deleteResource = async (req, res, next) =>
{
    try
    {
        const { id } = req.params;

        if (!isValidMongoId(id))
        {
            return res.status(400).json({
                success: false,
                message: "Invalid resource ID."
            });
        }

        const resource = await Resource.findById(id);

        if (!resource)
        {
            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });
        }

        if (resource.fileId)
        {
            await drive.files.delete({
                fileId: resource.fileId
            });
        }
        else if (resource.url.startsWith("/uploads/resources/"))
        {
            const filename = path.basename(resource.url);
            const file_path = path.join(UPLOAD_DIR, filename);

            await fs.unlink(file_path).catch((error) =>
            {
                if (error.code !== "ENOENT")
                {
                    throw error;
                }
            });
        }

        await resource.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Resource deleted successfully."
        });
    }
    catch (error)
    {
        next(error);
    }
};

module.exports = {
    getResourcesByModule,
    uploadResource,
    getResourceById,
    updateResource,
    deleteResource
};
