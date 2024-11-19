#[derive(Eq,Clone,Copy,Debug,PartialEq,serde::Deserialize,serde::Serialize)]
#[repr(u8)]
pub enum Direction {
	// Note, these value are used for mirroring.
	N = 0b00,
	W = 0b01,
	E = 0b10,
	S = 0b11,
}

pub const DIRECTIONS: [Direction; 4] = [
	Direction::N,
	Direction::W,
	Direction::E,
	Direction::S,
];

impl Direction {
	pub const fn to_bit(&self) -> u8 {
		1 << *self as u8
	}

	pub fn reverse(&self) -> Direction {
		(*self as u8 ^ 0b11).try_into().unwrap()
	}

	pub fn rotate_cw(&self) -> Direction {
		match self {
			Direction::N => Direction::E,
			Direction::E => Direction::S,
			Direction::S => Direction::W,
			Direction::W => Direction::N,
		}
	}

	pub fn rotate_cw_times(&self, times: u8) -> Direction {
		let mut r = *self;
		for _ in 0..times {
			r = r.rotate_cw()
		}
		r
	}
}

impl std::fmt::Display for Direction {
	fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
		write!(f, "{:?}", self)
	}
}

impl From<Direction> for u8 {
	fn from(value: Direction) -> Self {
		value as u8
	}
}

impl TryFrom<u8> for Direction {
	type Error = &'static str;

	fn try_from(value: u8) -> Result<Self, Self::Error> {
		DIRECTIONS.get(value as usize).copied().ok_or("Invalid direction.")
	}
}
