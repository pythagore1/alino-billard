import "server-only";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

// Type de fichier imposé côté serveur (inclus dans la signature, donc
// impossible à contourner depuis le client — contrairement à l'attribut
// HTML `accept`, qui ne fait que suggérer un filtre dans le sélecteur de
// fichiers). Relevé par l'audit sécurité : sans ça, seul le client décidait
// du type accepté.
//
// Note : `max_file_size` a été testé et n'est PAS appliqué par l'API
// d'upload signé de Cloudinary de cette façon (vérifié par un appel réel :
// un upload dépassant la limite passe quand même). La limite de poids
// réelle vient du plan Cloudinary souscrit (le plan gratuit plafonne déjà
// à 10 Mo par image / 100 Mo par vidéo) ; un garde-fou côté client est
// ajouté en plus pour l'expérience utilisateur, mais ce n'est pas une
// restriction de sécurité fiable — à ne pas présenter comme telle.
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif,gif,mp4,mov,webm";

/**
 * Signature d'upload générée côté serveur : le secret API ne quitte jamais
 * le serveur. Le navigateur envoie ensuite le fichier directement à
 * Cloudinary avec cette signature (upload direct, pas de proxy via notre
 * backend — évite de faire transiter des fichiers volumineux par nos
 * propres serveurs).
 */
export function createUploadSignature(folder: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder, allowed_formats: ALLOWED_FORMATS };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    signature,
    timestamp,
    folder,
    allowedFormats: ALLOWED_FORMATS,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
}
