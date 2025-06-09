//can be used memory storage rather than diskstorage ~~~ READ ABOUT IT ~~~ FUTURE BJJr.
import multer from "multer";

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

export const upload = multer({
    storage: storage
}) //because its es6 we dont need storage: storage, BUT I LIKE IT THAT WAYYYYYYYYYYYYYYYYYYY.. oohoohoho



