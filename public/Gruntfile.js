module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        cssmin: {
            compress: {
                options: {
                    keepSpecialComments: "0"
                },
                files: {
                    "static/css/app.css": [
                        "tmp/app.css"
                    ]
                }
            }
        },
        less: {
            app: {
                files: {
                    "tmp/app.css": [
                        "styles/application.less"
                    ]
                }
            }
        },
        concat: {
            options: {},
            dist: {
                src: [
                    "js/**/*.js",
                    "js/services/authService.js",
                    "js/services/userService.js",
                    "js/services/tokensService.js",
                    "js/factories/idFactory.js",
                    "js/controllers/appController.js",
                    "js/controllers/loginController.js," +
                    "js/controllers/tokensController.js"
                ],
                dest: "static/js/app.js"
            }
        }


    });


    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-less");

    grunt.registerTask("default", ["less", "cssmin", "concat"]);
};
