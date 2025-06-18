import "dotenv/config"; // <-- .env 파일을 process.env 로 로드
import { ExpoConfig, ConfigContext } from "@expo/config";

export default ({ config }) => ({
	...config,
	extra: {
		KAKAO_API_KEY: process.env.KAKAO_API_KEY,
	},
});
