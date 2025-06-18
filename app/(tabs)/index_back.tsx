import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
	const [count, setCount] = useState(0);

	const handlePlus = () => {
		setCount(count + 1);
	};
	const handleMinus = () => {
		setCount((prev) => prev - 1);
	};
	return (
		<View style={styles.container}>
			<Text style={styles.title}> 카운터 앱</Text>
			<Text style={styles.counter}>{count}</Text>
			<View style={styles.buttonWrapper}>
				<TouchableOpacity style={styles.button} onPress={handleMinus}>
					<Text style={styles.buttonText}>-1</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.button} onPress={handlePlus}>
					<Text style={styles.buttonText}>+1</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f0f0f0",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 30,
		color: "#333",
	},
	counter: {
		fontSize: 48,
		fontWeight: "bold",
		color: "#007AFF",
		marginBottom: 30,
	},
	button: {
		backgroundColor: "#007AFF",
		paddingHorizontal: 30,
		paddingVertical: 15,
		borderRadius: 25,
		elevation: 3,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	buttonText: {
		color: "white",
		fontSize: 18,
		fontWeight: "bold",
	},
	buttonWrapper: {
		flexDirection: "row",
		gap: 15,
	},
});
