'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // migrations/...-add-photo-to-presensi.js
async up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Presensis', 'buktiFoto', {
    type: Sequelize.STRING, // Menyimpan path/nama file
    allowNull: true
  });
},

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};


