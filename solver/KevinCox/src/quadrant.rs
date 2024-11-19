#[derive(Copy,Clone,Debug,Eq,PartialEq)]
pub enum Quadrant {
	TopLeft = 0,
	TopRight = 1,
	BottomRight = 2,
	BottomLeft = 3,
}

pub const QUADRANTS: &[Quadrant] = &[
	Quadrant::TopLeft,
	Quadrant::TopRight,
	Quadrant::BottomRight,
	Quadrant::BottomLeft,
];

impl Quadrant {
	pub fn cw_rotations(&self) -> u8 {
		*self as u8
	}
}

impl From<u8> for Quadrant {
	fn from(rotations: u8) -> Quadrant {
		QUADRANTS[rotations as usize % 4]
	}
}
