-- Align simulation_scenarios.sort_order with journey level order
UPDATE simulation_scenarios SET sort_order = 1 WHERE title = 'Perkenalkan Dirimu';
UPDATE simulation_scenarios SET sort_order = 2 WHERE title = 'Pergi ke Dokter Gigi';
UPDATE simulation_scenarios SET sort_order = 3 WHERE title = 'Berbicara dengan Guru';
UPDATE simulation_scenarios SET sort_order = 4 WHERE title = 'Bertemu Teman Baru';
UPDATE simulation_scenarios SET sort_order = 5 WHERE title = 'Membeli Makanan di Kantin';
UPDATE simulation_scenarios SET sort_order = 6 WHERE title = 'Presentasi di Depan Kelas';
UPDATE simulation_scenarios SET sort_order = 7 WHERE title = 'Naik Transportasi Umum';
UPDATE simulation_scenarios SET sort_order = 8 WHERE title = 'Menghadiri Pesta Ulang Tahun';
