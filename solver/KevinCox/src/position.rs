#[derive(Clone,Copy,Eq,Hash,Ord,PartialEq,PartialOrd)]
pub struct Position {
	xy: u8,
}

impl Position {
	const MIN: Self = Position::new(0, 0);
	const MAX: Self = Position::new(15, 15);

	pub const fn new(x: u8, y: u8) -> Self {
		debug_assert!(x < 16);
		debug_assert!(y < 16);

		Position {
			xy: (x << 4) | y,
		}
	}

	pub fn iter_unordered() -> impl Iterator<Item=Self> {
		(0..=255).map(|xy| Position{xy})
	}

	/** Iterates over the cells in a rectangle
	 *
	 * Yields each position in the rectangle specified by `tl` as the top-left point and `br` as the bottom right point inclusive.
	 */
	pub fn iter_rect(tl: Position, br: Position) -> impl Iterator<Item=Self> {
		(tl.y()..=br.y()).flat_map(move |y| (tl.x()..=br.x()).map(move |x| Position::new(x, y)))
	}

	pub fn iter_ordered() -> impl Iterator<Item=Self> {
		Self::iter_rect(Position::MIN, Position::MAX)
	}

	pub fn x(&self) -> u8 {
		self.xy >> 4
	}

	pub fn y(&self) -> u8 {
		self.xy & 0b00001111
	}

	pub fn xy(&self) -> (u8, u8) {
		(self.x(), self.y())
	}

	#[must_use]
	pub fn move_towards(&self, dir: crate::Direction) -> Self {
		debug_assert!(self.try_move_towards(dir, 1).is_some());
		let Position{xy} = *self;
		match dir {
			crate::Direction::N => Position{ xy: xy - 1 },
			crate::Direction::S => Position{ xy: xy + 1 },
			crate::Direction::E => Position{ xy: xy + (1 << 4) },
			crate::Direction::W => Position{ xy: xy - (1 << 4) },
		}
	}

	pub fn try_move_towards(&self, dir: crate::Direction, distance: u8) -> Option<Self> {
		debug_assert!(distance < 16);
		let Position{xy} = *self;
		match dir {
			crate::Direction::N => (self.y() >= distance).then(|| Position{ xy: xy - distance }),
			crate::Direction::S => (self.y() < 16 - distance).then(|| Position{ xy: xy + distance }),
			crate::Direction::E => (self.x() < 16 - distance).then(|| Position{ xy: xy + (distance << 4) }),
			crate::Direction::W => (self.x() >= distance).then(|| Position{ xy: xy - (distance << 4) }),
		}
	}

	pub fn in_quadrant(&self, quad: crate::Quadrant) -> Self {
		let (x, y) = self.xy();
		match quad {
			crate::Quadrant::TopLeft => Position::new(x, y),
			crate::Quadrant::TopRight => Position::new(15 - y, x),
			crate::Quadrant::BottomRight => Position::new(15 - x, 15 - y),
			crate::Quadrant::BottomLeft => Position::new(y, 15 - x),
		}
	}

	pub fn quadrant(&self) -> crate::Quadrant {
		let (x, y) = self.xy();
		match (x < 8, y < 8) {
			(true,  true ) => crate::Quadrant::TopLeft,
			(true,  false) => crate::Quadrant::TopRight,
			(false, true ) => crate::Quadrant::BottomLeft,
			(false, false) => crate::Quadrant::BottomRight,
		}
	}
}

impl std::fmt::Display for Position {
	fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
		write!(f, "({}, {})", self.x(), self.y())
	}
}

impl std::fmt::Debug for Position {
	fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
		write!(f, "Position({}, {})", self.x(), self.y())
	}
}

impl From<u8> for Position {
	#[inline(always)]
	fn from(value: u8) -> Self {
		Position { xy: value }
	}
}

impl TryFrom<(u8, u8)> for Position {
	type Error = ();

	fn try_from((x, y): (u8, u8)) -> Result<Self, ()> {
		if x > 15 || y > 15 {
			Err(())
		} else {
			Ok(Position::new(x, y))
		}
	}
}

impl From<Position> for u8 {
	#[inline(always)]
	fn from(value: Position) -> Self {
		value.xy
	}
}

impl From<Position> for usize {
	#[inline(always)]
	fn from(value: Position) -> Self {
		u8::from(value).try_into().unwrap()
	}
}

#[derive(serde::Deserialize,serde::Serialize)]
struct PositionSerde { x: u8, y: u8 }

impl<'de> serde::Deserialize<'de> for Position {
	fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
		let PositionSerde{x, y} = PositionSerde::deserialize(d)?;
		Ok(Position::new(x, y))
	}
}

impl serde::Serialize for Position {
	fn serialize<S: serde::Serializer>(&self, s: S) -> std::result::Result<S::Ok, S::Error> {
		let (x, y) = self.xy();
		PositionSerde{x, y}.serialize(s)
	}
}
