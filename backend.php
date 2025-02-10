<?php
    header("Access-Control-Allow-Origin: http://localhost:3000");
    header("Access-Control-Allow-Methods: GET");
    header('Content-Type: application/json');
    $path = "images/albums/*.{jpg,jpeg,png,webp}";
    $images = glob($path, GLOB_BRACE);
    echo json_encode($images);
?>