use std::fmt::Write;

const TAG: u8 = 0b0100_0000; // So that we are non-zero.

#[derive(Copy,Clone,Eq,PartialEq)]
pub struct Mirror {
	data: std::num::NonZeroU8,
}

impl Mirror {
	pub const fn new(left: bool, color: crate::Robot) -> Self {
		let lean = (left as u8) << 7;
		let pack = TAG | lean | color.as_u8();
		Mirror {
			// TODO: Remove when Option::unwrap is a const fn.
			data: unsafe { std::num::NonZeroU8::new_unchecked(pack) },
		}
	}

	pub fn left_leaning(&self) -> bool {
		self.data.get() & 0x80 != 0
	}
	
	pub fn toggle_lean(&mut self) {
		let data = self.data.get() ^ 1 << 7;
		self.data = std::num::NonZeroU8::new(data).unwrap();
	}
	
	pub fn color(&self) -> crate::Robot {
		(self.data.get() & 0b0011_1111).try_into().unwrap()
	}

	pub fn with_color(self, color: crate::Robot) -> Self {
		Mirror::new(self.left_leaning(), color)
	}

	pub fn bounces(&self, robot: crate::Robot) -> bool {
		robot != self.color()
	}

	pub fn bounce(&self, current_dir: crate::Direction) -> crate::Direction {
		match (current_dir, self.left_leaning()) {
			(crate::Direction::N, true ) => crate::Direction::W,
			(crate::Direction::N, false) => crate::Direction::E,
			(crate::Direction::S, true ) => crate::Direction::E,
			(crate::Direction::S, false) => crate::Direction::W,
			(crate::Direction::E, true ) => crate::Direction::S,
			(crate::Direction::E, false) => crate::Direction::N,
			(crate::Direction::W, true ) => crate::Direction::N,
			(crate::Direction::W, false) => crate::Direction::S,
		}
	}

	pub fn exit_direction(&self,
		robot: crate::Robot,
		current_dir: crate::Direction,
	) -> crate::Direction {
		if self.bounces(robot) {
			self.bounce(current_dir)
		} else {
			current_dir
		}
	}

	pub fn to_compact(&self, out: &mut impl std::io::Write) -> std::io::Result<()> {
		out.write_all(&[self.data.get()])
	}

	pub fn from_compact(data: &mut impl std::io::Read) -> std::io::Result<Self> {
		let mut byte = [0];
		data.read_exact(&mut byte)?;

		let left_leaning = byte[0] & 0x80 != 0;
		let color = crate::Robot::try_from(byte[0] & 0b0011_1111)
			.map_err(|_| std::io::Error::new(
				std::io::ErrorKind::InvalidInput,
				format!("Mirror colour is too big")))?;

		Ok(Mirror::new(left_leaning, color))
	}
}

impl std::fmt::Display for Mirror {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		f.write_str(self.color().color_vte())?;
		f.write_char(match self.left_leaning() {
			true  => '⟍',
			false => '⟋',
		})?;
		write!(f, "\x1B[0m")
	}
}

impl std::fmt::Debug for Mirror {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		write!(f, "{}", self)
	}
}
