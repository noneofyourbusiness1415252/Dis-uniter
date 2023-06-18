#![deny(clippy::all)]
#[macro_use]
extern crate napi_derive;
use napi::Result;
use std::{
  fs::*,
  io::{self, *},
  time::*,
};
const START: SeekFrom = SeekFrom::Start(0);
fn open_logs() -> io::Result<File> {
  File::options()
    .append(true)
    .create(true)
    .read(true)
    .open("log")
}
/**Outputs `message` in red and logs it as an error to ./log, clearing logs older than 24 hours*/
#[napi]
fn error(message: String) -> Result<()> {
  let mut file = open_logs()?;
  eprintln!("\x07\x1b[31m{}", message);
  file.write_all(b"\xE2\x9A\xA0")?;
  write_log(message, file)
}
/**Logs `message` in ./log, clearing logs older than 24 hours*/
#[napi]
fn debug(message: String) -> Result<()> {
  write_log(message, open_logs()?)
}
fn write_log(message: String, mut file: File) -> Result<()> {
  let now = SystemTime::now()
    .duration_since(SystemTime::UNIX_EPOCH)
    .unwrap()
    .as_millis() as u64;
  writeln!(file, "{now}: {message}")?;
  file.seek(START)?;
  let mut reader = BufReader::new(file);
  let mut line = String::new();
  let day_ago = now - 86400000;
  loop {
    if reader.read_line(&mut line)? == 0 {
      return Ok(());
    };
    let mut checked = false;
    let timestamp = line
      .chars()
      .skip_while(|&c| {
        if checked {
          return true;
        }
        checked = true;
        c == '⚠'
      })
      .map_while(|c| c.to_digit(10))
      .fold(0, |a, digit| a * 10 + digit as u64);
    if timestamp > day_ago {
      break;
    }
    line.clear();
  }
  let mut contents = vec![];
  reader.read_to_end(&mut contents)?;
  let mut file = reader.into_inner();
  file.set_len(0)?;
  file.seek(START)?;
  write!(file, "{line}")?;
  file.write_all(&contents)?;
  Ok(())
}
