// =====================================================================
//  Point d'entrée Tauri d'ONIRIA.
//  Enregistre les plugins fs / dialog / opener. Toute la logique de jeu
//  vit côté frontend (React) ; le Rust ne sert qu'à la coquille native et
//  à l'accès disque sécurisé via les plugins.
// =====================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("erreur lors du lancement d'ONIRIA");
}
