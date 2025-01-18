//
//  Created by Jovanni Lo (@lodev09)
//  Copyright (c) 2024-present. All rights reserved.
//
//  This source code is licensed under the MIT license found in the
//  LICENSE file in the root directory of this source tree.
//

extension UIColor {
  public convenience init?(name: String) {
    let allColors = [
      "aliceblue": "#F0F8FFFF",
      "antiquewhite": "#FAEBD7FF",
      "aqua": "#00FFFFFF",
      "aquamarine": "#7FFFD4FF",
      "azure": "#F0FFFFFF",
      "beige": "#F5F5DCFF",
      "bisque": "#FFE4C4FF",
      "black": "#000000FF",
      "blanchedalmond": "#FFEBCDFF",
      "blue": "#0000FFFF",
      "blueviolet": "#8A2BE2FF",
      "brown": "#A52A2AFF",
      "burlywood": "#DEB887FF",
      "cadetblue": "#5F9EA0FF",
      "chartreuse": "#7FFF00FF",
      "chocolate": "#D2691EFF",
      "coral": "#FF7F50FF",
      "cornflowerblue": "#6495EDFF",
      "cornsilk": "#FFF8DCFF",
      "crimson": "#DC143CFF",
      "cyan": "#00FFFFFF",
      "darkblue": "#00008BFF",
      "darkcyan": "#008B8BFF",
      "darkgoldenrod": "#B8860BFF",
      "darkgray": "#A9A9A9FF",
      "darkgrey": "#A9A9A9FF",
      "darkgreen": "#006400FF",
      "darkkhaki": "#BDB76BFF",
      "darkmagenta": "#8B008BFF",
      "darkolivegreen": "#556B2FFF",
      "darkorange": "#FF8C00FF",
      "darkorchid": "#9932CCFF",
      "darkred": "#8B0000FF",
      "darksalmon": "#E9967AFF",
      "darkseagreen": "#8FBC8FFF",
      "darkslateblue": "#483D8BFF",
      "darkslategray": "#2F4F4FFF",
      "darkslategrey": "#2F4F4FFF",
      "darkturquoise": "#00CED1FF",
      "darkviolet": "#9400D3FF",
      "deeppink": "#FF1493FF",
      "deepskyblue": "#00BFFFFF",
      "dimgray": "#696969FF",
      "dimgrey": "#696969FF",
      "dodgerblue": "#1E90FFFF",
      "firebrick": "#B22222FF",
      "floralwhite": "#FFFAF0FF",
      "forestgreen": "#228B22FF",
      "fuchsia": "#FF00FFFF",
      "gainsboro": "#DCDCDCFF",
      "ghostwhite": "#F8F8FFFF",
      "gold": "#FFD700FF",
      "goldenrod": "#DAA520FF",
      "gray": "#808080FF",
      "grey": "#808080FF",
      "green": "#008000FF",
      "greenyellow": "#ADFF2FFF",
      "honeydew": "#F0FFF0FF",
      "hotpink": "#FF69B4FF",
      "indianred": "#CD5C5CFF",
      "indigo": "#4B0082FF",
      "ivory": "#FFFFF0FF",
      "khaki": "#F0E68CFF",
      "lavender": "#E6E6FAFF",
      "lavenderblush": "#FFF0F5FF",
      "lawngreen": "#7CFC00FF",
      "lemonchiffon": "#FFFACDFF",
      "lightblue": "#ADD8E6FF",
      "lightcoral": "#F08080FF",
      "lightcyan": "#E0FFFFFF",
      "lightgoldenrodyellow": "#FAFAD2FF",
      "lightgray": "#D3D3D3FF",
      "lightgrey": "#D3D3D3FF",
      "lightgreen": "#90EE90FF",
      "lightpink": "#FFB6C1FF",
      "lightsalmon": "#FFA07AFF",
      "lightseagreen": "#20B2AAFF",
      "lightskyblue": "#87CEFAFF",
      "lightslategray": "#778899FF",
      "lightslategrey": "#778899FF",
      "lightsteelblue": "#B0C4DEFF",
      "lightyellow": "#FFFFE0FF",
      "lime": "#00FF00FF",
      "limegreen": "#32CD32FF",
      "linen": "#FAF0E6FF",
      "magenta": "#FF00FFFF",
      "maroon": "#800000FF",
      "mediumaquamarine": "#66CDAAFF",
      "mediumblue": "#0000CDFF",
      "mediumorchid": "#BA55D3FF",
      "mediumpurple": "#9370D8FF",
      "mediumseagreen": "#3CB371FF",
      "mediumslateblue": "#7B68EEFF",
      "mediumspringgreen": "#00FA9AFF",
      "mediumturquoise": "#48D1CCFF",
      "mediumvioletred": "#C71585FF",
      "midnightblue": "#191970FF",
      "mintcream": "#F5FFFAFF",
      "mistyrose": "#FFE4E1FF",
      "moccasin": "#FFE4B5FF",
      "navajowhite": "#FFDEADFF",
      "navy": "#000080FF",
      "oldlace": "#FDF5E6FF",
      "olive": "#808000FF",
      "olivedrab": "#6B8E23FF",
      "orange": "#FFA500FF",
      "orangered": "#FF4500FF",
      "orchid": "#DA70D6FF",
      "palegoldenrod": "#EEE8AAFF",
      "palegreen": "#98FB98FF",
      "paleturquoise": "#AFEEEEFF",
      "palevioletred": "#D87093FF",
      "papayawhip": "#FFEFD5FF",
      "peachpuff": "#FFDAB9FF",
      "peru": "#CD853FFF",
      "pink": "#FFC0CBFF",
      "plum": "#DDA0DDFF",
      "powderblue": "#B0E0E6FF",
      "purple": "#800080FF",
      "rebeccapurple": "#663399FF",
      "red": "#FF0000FF",
      "rosybrown": "#BC8F8FFF",
      "royalblue": "#4169E1FF",
      "saddlebrown": "#8B4513FF",
      "salmon": "#FA8072FF",
      "sandybrown": "#F4A460FF",
      "seagreen": "#2E8B57FF",
      "seashell": "#FFF5EEFF",
      "sienna": "#A0522DFF",
      "silver": "#C0C0C0FF",
      "skyblue": "#87CEEBFF",
      "slateblue": "#6A5ACDFF",
      "slategray": "#708090FF",
      "slategrey": "#708090FF",
      "snow": "#FFFAFAFF",
      "springgreen": "#00FF7FFF",
      "steelblue": "#4682B4FF",
      "tan": "#D2B48CFF",
      "teal": "#008080FF",
      "thistle": "#D8BFD8FF",
      "tomato": "#FF6347FF",
      "turquoise": "#40E0D0FF",
      "violet": "#EE82EEFF",
      "wheat": "#F5DEB3FF",
      "white": "#FFFFFFFF",
      "whitesmoke": "#F5F5F5FF",
      "yellow": "#FFFF00FF",
      "yellowgreen": "#9ACD32FF",
    ]

    let cleanedName = name.replacingOccurrences(of: " ", with: "").lowercased()

    if let hex = allColors[cleanedName] {
      self.init(hex: hex)
    } else {
      self.init(hex: name)
    }
  }

  // Hex string: #RRGGBB or #RRGGBBAA
  convenience init?(hex: String) {
    var hexString = hex.trimmingCharacters(in: .whitespacesAndNewlines)

    // Check if hex string has a '#' prefix
    if hexString.hasPrefix("#") {
      hexString.removeFirst()
    }

    // Make sure it's 6 or 8 characters long
    if hexString.count == 6 || hexString.count == 8 {
      var rgb: UInt64 = 0
      Scanner(string: hexString).scanHexInt64(&rgb)

      if hexString.count == 6 {
        self.init(
          red: CGFloat((rgb & 0xFF0000) >> 16) / 255.0,
          green: CGFloat((rgb & 0x00FF00) >> 8) / 255.0,
          blue: CGFloat(rgb & 0x0000FF) / 255.0,
          alpha: 1.0
        )
      } else {
        self.init(
          red: CGFloat((rgb & 0xFF00_0000) >> 24) / 255.0,
          green: CGFloat((rgb & 0x00FF_0000) >> 16) / 255.0,
          blue: CGFloat((rgb & 0x0000_FF00) >> 8) / 255.0,
          alpha: CGFloat(rgb & 0x0000_00FF) / 255.0
        )
      }
    } else {
      return nil
    }
  }
}
