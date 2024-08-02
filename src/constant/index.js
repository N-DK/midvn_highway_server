const VN_REGION =
    'http://overpass-api.de/api/interpreter?data=[out:json];way[%22highway%22=%22motorway%22](9.0,102.0,24.0,110.0);out%20geom;';
const VN_REGION_TRUNK =
    'http://overpass-api.de/api/interpreter?data=[out:json];way[%22highway%22=%22trunk%22](9.0,102.0,24.0,110.0);out%20geom;';
const VN_REGION_TOLL_BOTH =
    'https://overpass-api.de/api/interpreter?data=[out:json];node[%22barrier%22=%22toll_booth%22](9.0,102.0,24.0,110.0);out%20geom;';
const TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyMmMwMmNlOC01NjI0LTRjMjctOTdiMS05ZTJhN2FmNjQwMWUiLCJpYXQiOiIxNzIyNTA5ODg0NTg4Iiwic3ViIjoiYzcxNGNjN2EtYzAwZC00NzFmLThkNmMtMjA3YmViMjI1ZDA3IiwiWG5Db2RlIjoiMjU1MiIsIkN1c3RvbWVyQ29kZSI6IiIsImV4cCI6MTcyMjQ5OTA4NCwiaXNzIjoiMTAuMC4xMC42OCJ9.xD2iXIYqrj4e6iX8qxw3dKqNaNGHChalSoMo8H2bORc';

module.exports = { VN_REGION, VN_REGION_TRUNK, VN_REGION_TOLL_BOTH, TOKEN };
