// import AgoraRTC from "agora-rtc-sdk-ng";
// import api from "../api/api";

// export async function joinVideo(channel) {
//   const { data } = await api.get(`/rtc/token?channel=${channel}`);

//   const client = AgoraRTC.createClient({
//     mode: "rtc",
//     codec: "vp8",
//   });

//  const uuid= await client.join(
//     import.meta.env.VITE_AGORA_APP_ID,
//     channel,
//     data.token,
//     data.agora_uid
//   );
//   console.log(uuid,"uuid of join video");

//   return client;
// }
