#[derive(Clone,Copy,Debug,Eq,PartialEq,Ord,PartialOrd,serde::Deserialize,serde::Serialize)]
#[serde(into="u8",try_from="u8")]
pub enum Robot {
	BLACK = 0,
	RED,
	GREEN,
	YELLOW,
	BLUE,
}

pub const ROBOTS: [Robot; 5] = [
	Robot::BLACK,
	Robot::RED,
	Robot::GREEN,
	Robot::YELLOW,
	Robot::BLUE,
];

impl Robot {
	pub fn iter<T>(arr: [T; 5]) -> impl Iterator<Item=(Robot, T)> {
		arr.into_iter().enumerate().map(|(i, v)| (ROBOTS[i], v))
	}

	pub const fn as_u8(self) -> u8 {
		self as u8
	}

	pub fn as_char(self) -> char {
		('⓵' as u32 + self.as_u8() as u32).try_into().unwrap()
	}

	pub fn as_char_alt(self) -> char {
		('➊' as u32 + self.as_u8() as u32).try_into().unwrap()
	}

	pub fn color_vte(self) -> &'static str {
		*[
			"\x1B[39m",
			"\x1B[31m",
			"\x1B[32m",
			"\x1B[33m",
			"\x1B[34m",
		].get(self.as_u8() as usize).unwrap_or(&"\x1B[39m")
	}
}

impl Into<u8> for Robot {
	fn into(self) -> u8 {
		return self as u8
	}
}

impl TryFrom<u8> for Robot {
	type Error = std::num::TryFromIntError;
	fn try_from(value: u8) -> Result<Self, Self::Error> {
		ROBOTS.get(value as usize)
			.cloned()
			.ok_or(u8::try_from(u16::max_value()).unwrap_err())
	}
}

impl std::str::FromStr for Robot {
	type Err = &'static str;
	fn from_str(s: &str) -> Result<Self, Self::Err> {
		match s {
			"0" | "k" | "black" => Ok(Robot::BLACK),
			"1" | "r" | "red" => Ok(Robot::RED),
			"2" | "g" | "green" => Ok(Robot::GREEN),
			"3" | "y" | "yellow" => Ok(Robot::YELLOW),
			"4" | "u" | "blue" => Ok(Robot::BLUE),
			_ => Err("Unknown robot"),
		}
	}
}
