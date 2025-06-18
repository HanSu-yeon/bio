// components/KakaoMapScreen.tsx

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { WebView } from "react-native-webview";

interface LocationCoords {
	lat: number;
	lng: number;
}

interface WebViewMessage {
	type: "mapClick" | "getCurrentLocation" | "mapReady";
	lat?: number;
	lng?: number;
}

// 인라인 HTML 템플릿 (Expo Go 개발용)
const htmlContent = (apiKey: string) => `
<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"/>
  <title>카카오 지도</title>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false"></script>
  <style>
    html,body{margin:0;padding:0;width:100%;height:100%}
    #map{width:100%;height:100%}
    .loading{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);}
    .btn{position:absolute;top:15px;right:15px;z-index:1000;padding:8px;
         background:white;border:1px solid #ccc;border-radius:4px;}
  </style>
</head><body>
  <div id="loading" class="loading"><p>지도 로딩 중…</p></div>
  <div id="map"></div>
  <script>
    kakao.maps.load(()=>{
      const map = new kakao.maps.Map(
        document.getElementById('map'),
        { center:new kakao.maps.LatLng(37.5665,126.9780), level:3, scrollwheel:false }
      );
      const marker = new kakao.maps.Marker({ position: map.getCenter() });
      marker.setMap(map);
      document.getElementById('loading').style.display='none';

      // “내 위치” 버튼
      const btn = document.createElement('button');
      btn.innerText = '📍';
      btn.className = 'btn';
      btn.onclick = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type:'getCurrentLocation' }));
      };
      document.body.appendChild(btn);

      // mapReady 신호
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:'mapReady' }));

      // React Native → WebView 메시지 리스너
      function handleRNMessage(e) {
        try {
          const raw = e.data || e.detail;
          const msg = JSON.parse(raw);
          if (msg.type === 'moveToLocation') {
            const pos = new kakao.maps.LatLng(msg.lat, msg.lng);
            map.setCenter(pos);
            marker.setPosition(pos);
          }
        } catch {}
      }
      document.addEventListener('message', handleRNMessage); // Android
      window.addEventListener('message', handleRNMessage);   // iOS/WebKit
    });
  </script>
</body></html>
`;

export default function KakaoMapScreen() {
	const webRef = useRef<WebView>(null);
	const [htmlBody, setHtmlBody] = useState<string | null>(null);
	const [mapReady, setMapReady] = useState(false);
	const [loadingLoc, setLoadingLoc] = useState(false);

	// APK(prod) 빌드시 assets/kakao_map.html 읽어서 placeholder 치환
	useEffect(() => {
		if (Constants.appOwnership !== "expo") {
			(async () => {
				const asset = Asset.fromModule(require("../../assets/kakao_map.html"));
				await asset.downloadAsync();
				let raw = await FileSystem.readAsStringAsync(asset.localUri!);
				// placeholder "__KAKAO_API_KEY__"을 실제 키로 치환
				const apiKey = (Constants.expoConfig ?? Constants.manifest).extra.KAKAO_API_KEY as string;
				raw = raw.replace(/__KAKAO_API_KEY__/g, apiKey);
				setHtmlBody(raw);
			})();
		}
	}, []);

	// “내 위치” 버튼 로직 (항상 postMessage 호출)
	const goCurrent = async () => {
		setLoadingLoc(true);
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") throw new Error("permission denied");
			const loc = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
				timeout: 10000,
			});
			const { latitude: lat, longitude: lng } = loc.coords;
			webRef.current?.postMessage(JSON.stringify({ type: "moveToLocation", lat, lng }));
			Alert.alert("현재 위치", `위도: ${lat}\n경도: ${lng}`);
		} catch {
			Alert.alert("오류", "위치 정보를 가져올 수 없습니다.");
		} finally {
			setLoadingLoc(false);
		}
	};

	// WebView → RN 메시지 핸들러
	const onMessage = (e: any) => {
		try {
			const msg: WebViewMessage = JSON.parse(e.nativeEvent.data);
			if (msg.type === "mapReady") setMapReady(true);
			if (msg.type === "getCurrentLocation") goCurrent();
			if (msg.type === "mapClick" && msg.lat != null) {
				Alert.alert("선택된 위치", `위도: ${msg.lat}\n경도: ${msg.lng}`);
			}
		} catch {}
	};

	// WebView source 분기: Expo Go(dev)=inline / APK(prod)=htmlBody
	const apiKey = (Constants.expoConfig ?? Constants.manifest).extra.KAKAO_API_KEY as string;
	const source =
		Constants.appOwnership === "expo" ? { html: htmlContent(apiKey) } : htmlBody ? { html: htmlBody } : undefined;

	if (!source) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" />
				<Text>지도 로딩 중…</Text>
			</View>
		);
	}

	// 최초 mapReady 시 기본 위치(서울시청) 이동
	useEffect(() => {
		if (mapReady) {
			webRef.current?.postMessage(
				JSON.stringify({
					type: "moveToLocation",
					lat: 37.5665,
					lng: 126.978,
				})
			);
		}
	}, [mapReady]);

	return (
		<View style={styles.full}>
			<View style={styles.btns}>
				{[
					["남대문", { lat: 37.5502, lng: 126.9824 }],
					["경복궁", { lat: 37.5519, lng: 126.9918 }],
					["서울시청", { lat: 37.5665, lng: 126.978 }],
				].map(([label, pos]) => (
					<TouchableOpacity
						key={label as string}
						style={styles.btn}
						onPress={() =>
							webRef.current?.postMessage(
								JSON.stringify({
									type: "moveToLocation",
									lat: (pos as any).lat,
									lng: (pos as any).lng,
								})
							)
						}
					>
						<Text>{label}</Text>
					</TouchableOpacity>
				))}
				<TouchableOpacity style={[styles.btn, styles.locBtn]} onPress={goCurrent} disabled={loadingLoc}>
					<Text>{loadingLoc ? "검색중…" : "내 위치"}</Text>
				</TouchableOpacity>
			</View>
			<WebView
				ref={webRef}
				originWhitelist={["*"]}
				source={source}
				onMessage={onMessage}
				javaScriptEnabled
				domStorageEnabled
				mixedContentMode="compatibility"
				allowFileAccess
				allowFileAccessFromFileURLs
				allowUniversalAccessFromFileURLs
				style={styles.full}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	full: { flex: 1 },
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
	btns: {
		flexDirection: "row",
		flexWrap: "wrap",
		padding: 8,
		backgroundColor: "#f8f9fa",
	},
	btn: {
		backgroundColor: "#FEE500",
		padding: 8,
		margin: 4,
		borderRadius: 6,
	},
	locBtn: {
		backgroundColor: "#007AFF",
	},
});
