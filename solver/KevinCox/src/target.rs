#[derive(Copy,Clone,Debug,serde::Deserialize,serde::Serialize)]
pub struct Target {
	pub position: crate::Position,
	pub robot: Option<crate::Robot>,
}

impl Target {
	pub fn matches(&self, pos: crate::Position, robot: crate::Robot) -> bool {
		pos == self.position
			&& (
				self.robot.is_none()
				|| Some(robot) == self.robot)
	}

	pub fn from_compact(data: &mut impl std::io::Read) -> std::io::Result<Self> {
		let mut bytes = [0; 2];
		data.read_exact(&mut bytes)?;

		Ok(Target {
			position: crate::Position::from(bytes[0]),
			robot: if bytes[1] == u8::max_value() {
				None
			} else {
				Some(bytes[1].try_into().unwrap())
			},
		})
	}

	pub fn to_compact(&self, out: &mut impl std::io::Write) -> std::io::Result<()> {
		out.write_all(&[
			self.position.into(),
			self.robot.map(|r| r.as_u8()).unwrap_or(u8::max_value()),
		])
	}
}

impl std::fmt::Display for Target {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		if let Some(robot) = self.robot {
			f.write_str(robot.color_vte())?;
		}
		f.write_str("\x1B[22m🞜\x1B[0m")
	}
}
