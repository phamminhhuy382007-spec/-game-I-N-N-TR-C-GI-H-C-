// Map content placed on the painted backgrounds. y = feet / bottom of each sprite.
(function () {
  const S = (img, x, y, h, extra) => Object.assign({ img, x, y, h }, extra || {});
  window.MAPS_DEF = [
    // ======================================================== MAP 1 KHU PHỐ
    {
      id: 1, name: "KHU PHỐ", time: "time_map1", bg: "bg1", start: [70, 300],
      objective: (f) => f.boxesOpen ? "Vỉa hè thông rồi! Chạy tới WC cửa xanh lá cuối phố." :
        "Tìm nhà vệ sinh DÙNG ĐƯỢC (cửa xanh lá). Có thùng hàng chắn vỉa hè phía trước...",
      shade: [[945, 325, 50, 150, 0.35]],
      labels: [{ x: 970, y: 330, text: "HẺM (đi tắt)", cls: "street" }],
      toilets: [
        { id: "m1_locked", state: "locked", x: 480, y: 262, msg: "Cạch cạch! Ổ khóa to hơn cả cái cặp của Minh. Giấy dán: \"Hỏng từ hôm qua\"." },
        { id: "m1_ok", state: "ok", x: 1395, y: 262 },
        { id: "m1_maint", state: "maint", x: 330, y: 868, msg: "\"ĐANG SỬA ỐNG NƯỚC\". Chú thợ ló đầu ra: \"WC cuối phố bên phải vẫn dùng được đấy cháu!\"" },
      ],
      props: [
        S("prop_stool", 258, 272, 26, { foot: [26, 12] }),
        S("prop_moto_red", 420, 548, 62, { foot: [90, 22] }), S("prop_moto_blue", 1210, 548, 62, { foot: [90, 22] }),
        S("prop_moto_red", 760, 858, 62, { foot: [90, 22] }), S("prop_moto_blue", 1110, 860, 62, { foot: [90, 22] }),
      ],
      gates: [
        { id: "boxes", rect: [850, 268, 90, 57], sprites: [S("prop_boxes", 895, 326, 70)], openTo: [[990, 300, 0.75]] },
        { id: "dog", rect: [945, 425, 50, 50], sprites: [S("dog_sleep", 970, 474, 38)], openTo: [[1060, 560, 1]], zzz: true, talk: "dog" },
      ],
      npcs: [
        { id: "vendor", img: "npc_vendor", name: "Cô bán hàng", x: 895, y: 268, h: 84, solidRect: [850, 222, 90, 46], talk: "vendor" },
        { id: "oldman", img: "npc_oldman", name: "Ông Tư", x: 205, y: 270, h: 70, foot: [56, 22],
          lines: ["Cái WC công cộng đầu phố khóa từ hôm qua rồi cháu ạ.", "Đi thẳng cuối phố, cái cửa xanh lá ấy, vẫn dùng được!"] },
        { id: "mover", img: "npc_mover", name: "Anh Tuấn", x: 640, y: 660, h: 88, foot: [48, 20], talk: "mover" },
        { id: "ped_a", img: "npc_ped_a", name: "Cô Hoa", x: 320, y: 610, h: 80, foot: [36, 16], patrol: [[320, 610], [880, 610]], speed: 38,
          lines: ["Ôi trời, đi đâu mà vội thế cháu?", "Cẩn thận con chó trong hẻm, nó ngủ say lắm!"] },
        { id: "ped_b", img: "npc_ped_b", name: "Chú đi bộ", x: 1120, y: 710, h: 82, foot: [36, 16], patrol: [[1120, 710], [1460, 710]], speed: 30,
          lines: ["(Mải nhìn điện thoại...) Hả? Ừ... ừ..."] },
      ],
      things: [
        { id: "cafe", img: "prop_signboard", name: "Biển quán", x: 305, y: 274, h: 54, foot: [40, 16], sign: "CÀ PHÊ\nTRÀ ĐÁ\nBÁNH MÌ",
          lines: ["Mùi cà phê thơm quá... Nhưng bây giờ thêm nước vào bụng là dại!"] },
      ],
    },
    // ======================================================== MAP 2 CHỢ
    {
      id: 2, name: "CHỢ", time: "time_map2", bg: "bg2", start: [80, 800],
      objective: (f) => f.spillOpen ? "Lối giữa thông rồi! WC dùng được ở sau LỐI HẸP cạnh sạp cá." :
        f.toldPassage ? "Đi LỐI HẸP cạnh sạp cá (phía trên bên phải) để tới WC dùng được." :
        "Chợ đông quá! Tìm nhà vệ sinh DÙNG ĐƯỢC. Hỏi người bán hàng xem sao.",
      shade: [[1240, 330, 50, 90, 0.45]],
      labels: [{ x: 1265, y: 336, text: "LỐI HẸP", cls: "street" }],
      toilets: [
        { id: "m2_locked", state: "locked", x: 200, y: 290, tag: "KHÓA", msg: "\"WC DÀNH CHO TIỂU THƯƠNG\". Khóa chặt. Chìa ở trong túi bà chủ sạp, mà bà chủ thì đi lấy hàng rồi." },
        { id: "m2_queue", state: "queue", x: 690, y: 290, msg: "Hàng chờ 4 người! Bác đầu hàng: \"Xếp hàng đi cháu, ai cũng gấp cả!\" Chắc phải 10 phút..." },
        { id: "m2_ok", state: "ok", x: 1420, y: 290 },
      ],
      props: [
        S("stall_red", 110, 420, 150, { foot: [180, 90] }), S("stall_cloth", 290, 420, 150, { foot: [180, 90] }),
        S("stall_yellow", 560, 420, 150, { foot: [180, 90] }), S("stall_red", 740, 420, 150, { foot: [180, 90] }),
        S("stall_cloth", 920, 420, 150, { foot: [180, 90] }),
        S("prop_crates", 1068, 420, 66, { foot: [116, 90] }), S("prop_crates", 1182, 420, 66, { foot: [116, 90] }),
        S("stall_blue", 1380, 420, 150, { foot: [180, 90] }), S("prop_crates", 1505, 420, 62, { foot: [66, 90] }),
        S("prop_crates", 1175, 276, 60, { foot: [56, 61], w: 60 }), S("prop_crates", 1175, 330, 60, { foot: [56, 54], w: 60 }),
        S("prop_crates", 100, 690, 66, { foot: [200, 90] }),
        S("stall_yellow", 380, 690, 150, { foot: [180, 90] }), S("stall_blue", 560, 690, 150, { foot: [180, 90] }),
        S("stall_red", 740, 690, 150, { foot: [180, 90] }), S("stall_cloth", 920, 690, 150, { foot: [180, 90] }),
        S("stall_yellow", 1100, 690, 150, { foot: [180, 90] }), S("stall_blue", 1280, 690, 150, { foot: [180, 90] }),
        S("prop_crates", 1500, 690, 62, { foot: [76, 90] }),
        S("queue", 868, 294, 84, { foot: [220, 30], talk: "queue", name: "Hàng người chờ" }),
        S("crowd", 790, 572, 92, { foot: [110, 32], name: "Đám đông", lines: ["\"Chen gì mà chen! Từ từ thôi cháu!\""] }),
      ],
      gates: [
        { id: "spill", rect: [1080, 495, 100, 105], sprites: [S("prop_spill", 1130, 548, 44), S("prop_spill", 1122, 598, 42)], openTo: [[1130, 548, 0], [1122, 598, 0]] },
      ],
      npcs: [
        { id: "shopper", img: "npc_shopper", name: "Bà Năm", x: 1130, y: 494, h: 82, solidRect: [1080, 420, 100, 75], talk: "shopper", openTo: [1210, 470] },
        { id: "fishvendor", img: "npc_fishvendor", name: "Cô bán cá", x: 470, y: 470, h: 84, foot: [44, 20], talk: "fishvendor" },
        { id: "vegvendor", img: "npc_vegvendor", name: "Chú bán rau", x: 990, y: 470, h: 84, foot: [44, 20],
          lines: ["Rau muống tươi đây! À, WC hả? Lối hẹp cạnh sạp cá ấy, chui qua là thấy."] },
        { id: "crowd1", img: "crowd", name: "Đám đông", x: 420, y: 800, h: 92, foot: [104, 30], patrol: [[420, 800], [930, 800]], speed: 34,
          lines: ["\"Chen gì mà chen! Từ từ thôi cháu!\""] },
        { id: "crowd2", img: "crowd", name: "Đám đông", x: 1320, y: 780, h: 92, foot: [104, 30], patrol: [[1320, 780], [1010, 780]], speed: 30,
          lines: ["\"Ơ kìa, đi đâu mà như ma đuổi thế?\""] },
      ],
      things: [
        { id: "passage", name: "Lối hẹp", x: 1265, y: 470, r: 55, label: "Xem", lines: ["Lối hẹp cạnh sạp cá. Hơi tanh... nhưng thông thẳng ra phía sau!"] },
      ],
    },
    // ======================================================== MAP 3 CÔNG VIÊN
    {
      id: 3, name: "CÔNG VIÊN", time: "time_map3", bg: "bg3", start: [140, 790],
      objective: (f) => f.gotKey ? "Đã có chìa khóa! WC cửa xanh dương trên lối gạch phía trên dùng được rồi." :
        f.toldSide ? "Đi lối gạch bên trái lên phía trên, vòng qua hồ tới WC." :
        "Tìm nhà vệ sinh DÙNG ĐƯỢC. Lối chính bên phải hình như bị chặn...",
      labels: [],
      toilets: [
        { id: "m3_maint", state: "maint", x: 1468, y: 832, msg: "\"ĐANG BẢO TRÌ - XIN LỖI VÌ SỰ BẤT TIỆN\". Bất tiện thật sự luôn ấy!" },
        { id: "m3_key", state: "need_key", x: 640, y: 186, needFlag: "gotKey",
          msg: "Cửa khóa, có dán chữ: \"Chìa khóa: hỏi cô làm vườn\". Cô làm vườn đang đứng ở lối chính bên phải." },
        { id: "m3_ok", state: "ok", x: 1420, y: 262 },
      ],
      props: [
        S("tree_flame", 280, 700, 200), S("tree_flame", 990, 360, 190),
        S("tree_flame", 1340, 720, 200), S("tree_flame", 330, 1010, 200), S("tree_flame", 900, 1012, 190),
        S("tree_flame", 45, 520, 180),
        S("prop_bench", 760, 740, 44), S("prop_bench", 460, 262, 44),
        S("prop_bench", 1300, 498, 44, { foot: [80, 14] }),
        S("prop_lamp", 1200, 498, 108, { foot: [16, 10] }), S("prop_lamp", 92, 744, 108),
        S("prop_bush", 1240, 1000, 54), S("prop_bush", 600, 1005, 50),
      ],
      gates: [],
      fixed: [{ id: "rope", img: "prop_rope", name: "Dây chắn", x: 1142, y: 576, h: 56, w: 100, rect: [1100, 548, 85, 28], sign: "ĐANG TƯỚI\nCẤM QUA!",
        lines: ["Biển viết tay: \"ĐANG TƯỚI CÂY & PHUN THUỐC - CẤM QUA\". Nhìn bùn lầy là biết không qua được."] }],
      npcs: [
        { id: "gardener", img: "npc_gardener", name: "Cô làm vườn", x: 1142, y: 650, h: 84, foot: [44, 18], talk: "gardener" },
        { id: "child", img: "npc_child", name: "Bé Bin", x: 560, y: 792, h: 56, foot: [30, 14], talk: "child" },
        { id: "grandpa", img: "npc_grandpa", name: "Ông tập dưỡng sinh", x: 1310, y: 440, h: 82, foot: [40, 18],
          lines: ["Hít vào... thở ra... Cháu cũng nên thở đều đi, mặt xanh lét kìa!"] },
      ],
      ball: { x0: 430, x1: 820, y: 822 },
      things: [
        { id: "pond", name: "Hồ cá", x: 615, y: 760, r: 70, label: "Xem", lines: ["Cá chép ngoi lên đớp đớp... Tiếng nước róc rách. KHÔNG! Đừng nghe tiếng nước lúc này!"] },
        { id: "grass", img: "prop_signboard", name: "Biển", x: 236, y: 744, h: 48, sign: "KHÔNG\nGIẪM CỎ", lines: ["\"Không giẫm lên cỏ\". Được rồi, được rồi, đi đúng lối gạch..."] },
      ],
    },
    // ======================================================== MAP 4 CỔNG TRƯỜNG
    {
      id: 4, name: "CỔNG TRƯỜNG", time: "time_map4", bg: "bg4", start: [100, 822],
      objective: (f) => f.guardOk ? "Bác bảo vệ đã mở cửa! Vào WC nhà xe qua CỔNG PHỤ bên phải." :
        "Tìm nhà vệ sinh DÙNG ĐƯỢC. WC nhà xe (qua cổng phụ) cần bác bảo vệ mở cửa.",
      labels: [
        { x: 1010, y: 330, text: "CHÀO MỪNG CÁC EM ĐẾN TRƯỜNG", cls: "banner" },
        { x: 1218, y: 350, text: "CỔNG PHỤ", cls: "street" }, { x: 1350, y: 130, text: "NHÀ XE", cls: "street" },
      ],
      toilets: [
        { id: "m4_locked", state: "locked", x: 230, y: 868, msg: "WC công cộng: \"Mở cửa từ 8 giờ\". Bây giờ là 6 giờ 55. Nghiệt ngã!" },
        { id: "m4_maint", state: "maint", x: 300, y: 230, msg: "\"ĐANG SỬA - Dùng tạm WC nhà xe\". WC nhà xe ở góc phải sân, đi qua cổng phụ." },
        { id: "m4_paper", state: "need_paper", x: 1440, y: 232, needFlag: "guardOk", msg: "WC nhà xe đang khóa. Phải có bác bảo vệ (đứng ở cổng phụ) mở cửa." },
      ],
      props: [
        S("prop_banner", 1010, 372, 64, { w: 270 }),
        S("guard_booth", 1090, 545, 104, { foot: [100, 45] }),
        S("prop_bikes", 1290, 200, 76, { foot: [140, 30] }),
        S("prop_bags", 520, 548, 38, { foot: [60, 20] }), S("prop_bags", 980, 650, 38, { foot: [60, 20] }),
        S("prop_bags", 380, 735, 38, { foot: [60, 20] }),
      ],
      gates: [],
      npcs: [
        { id: "guard", img: "npc_guard", name: "Bác bảo vệ", x: 1218, y: 455, h: 88, solidRect: [1180, 415, 75, 42], talk: "guard", openTo: [1300, 512] },
        { id: "friend", img: "npc_friend", name: "Hùng", x: 470, y: 690, h: 78, foot: [40, 18], talk: "friend" },
        { id: "st1", img: "npc_student_b", name: "Học sinh", x: 720, y: 620, h: 74, foot: [34, 16], patrol: [[720, 620], [720, 250]], speed: 55, lines: ["Đông quá, chen mãi mới vào!"] },
        { id: "st2", img: "npc_student_a", name: "Học sinh", x: 805, y: 260, h: 74, foot: [34, 16], patrol: [[805, 260], [805, 640]], speed: 50, lines: ["Ê Minh! Sắp vào lớp rồi đó!"] },
        { id: "st3", img: "npc_student_b", name: "Học sinh", x: 760, y: 500, h: 74, foot: [34, 16], patrol: [[760, 500], [760, 200]], speed: 42, lines: ["Cho tớ qua với..."] },
        { id: "st4", img: "npc_student_a", name: "Học sinh", x: 150, y: 505, h: 74, foot: [34, 16], patrol: [[150, 505], [980, 505]], speed: 45, lines: ["Chào Minh! Sao mặt cậu tái thế?"] },
        { id: "st5", img: "npc_student_a", name: "Học sinh", x: 300, y: 290, h: 74, foot: [34, 16], patrol: [[300, 290], [1050, 290]], speed: 40, lines: ["Hôm nay kiểm tra 15 phút đấy!"] },
      ],
      things: [
        { id: "bags", name: "Cặp sách", x: 980, y: 662, r: 55, label: "Xem", lines: ["Ai vứt cặp giữa đường thế này... Nhảy qua thì không dám, đi vòng thôi."] },
        { id: "banner", name: "Băng rôn", x: 1010, y: 470, r: 70, label: "Đọc", lines: ["\"Chào mừng các em đến trường\". Trường ơi, cho em mượn cái WC!"] },
      ],
    },
    // ======================================================== MAP 5 DÃY LỚP HỌC
    {
      id: 5, name: "DÃY LỚP HỌC", time: "time_map5", bg: "bg5", start: [90, 880], cool: true,
      objective: (f) => f.dryStrip ? "Đi sát mép dưới hành lang trên (dải sàn khô) tới WC ở cuối." :
        "WC dùng được ở cuối hành lang TRÊN, bên phải. Coi chừng sàn ướt, lối bên phải đang sơn.",
      shade: [[1005, 238, 60, 332, 0.25]],
      labels: [
        { x: 1035, y: 246, text: "LỐI GIỮA", cls: "street" },
        { x: 97, y: 22, text: "10A1", cls: "door" }, { x: 460, y: 22, text: "10A2", cls: "door" },
        { x: 812, y: 22, text: "10A3", cls: "door" }, { x: 1140, y: 22, text: "10A4", cls: "door" }, { x: 1478, y: 22, text: "10A5", cls: "door" },
      ],
      wet: [640, 125, 180, 113], wetDry: 40,
      toilets: [
        { id: "m5_ok", state: "ok", x: 1462, y: 200 },
        { id: "m5_locked", state: "locked", x: 1453, y: 560, tag: "WC GIÁO VIÊN", msg: "\"WC GIÁO VIÊN\". Khóa. Có lẽ thế là tốt, chẳng ai muốn gặp thầy hiệu trưởng ở đây." },
        { id: "m5_maint", state: "maint", x: 1420, y: 940, msg: "\"ĐANG SỬA\". Mũi tên chỉ đường dẫn tới đây... đúng là cú lừa! Lên hành lang trên đi." },
      ],
      props: [
        S("prop_pot_tall", 30, 420, 66, { foot: [34, 16] }), S("prop_bench", 640, 940, 44, { foot: [80, 14] }),
        S("prop_pot_tall", 1515, 700, 66, { foot: [34, 16] }),
      ],
      fixed: [
        { id: "barrier", img: "prop_barrier", name: "Rào chắn", x: 1453, y: 420, h: 58, w: 166, rect: [1370, 382, 166, 38], sign: "ĐANG SƠN\nLỐI TẠM ĐÓNG",
          lines: ["\"ĐANG SƠN - LỐI TẠM ĐÓNG\". Sơn còn ướt, mùi nồng nặc. Không qua được."] },
        { id: "wcsign", img: "prop_wcsign", name: "Biển chỉ đường", x: 880, y: 600, h: 66, sign: "WC →", crooked: true,
          lines: ["Mũi tên \"WC →\" chỉ sang phải, xuống sân... nhưng băng dính dán đè ghi nguệch ngoạc: \"WC dùng được: CUỐI HÀNH LANG TRÊN!\""] },
        { id: "notice", img: "prop_noticeboard", name: "Bảng tin", x: 300, y: 600, h: 76, rect: [262, 582, 76, 18],
          lines: ["Thông báo: \"Tiết 1: Kiểm tra 15 phút. Đi muộn: KHÔNG ĐƯỢC VÀO LỚP.\" Gulp."] },
      ],
      gates: [
        { id: "wet", rect: [640, 125, 180, 113], sprites: [S("prop_wetsign", 790, 180, 50)], openTo: [[790, 180, 1]], shrinkTo: [640, 125, 180, 70] },
      ],
      npcs: [
        { id: "cleaner", img: "npc_cleaner", name: "Cô lao công", x: 682, y: 190, h: 84, foot: [60, 24], talk: "cleaner" },
        { id: "teacher", img: "npc_teacher", name: "Cô giám thị", x: 600, y: 650, h: 88, foot: [44, 20], talk: "teacher" },
        { id: "s1", img: "npc_student_a", name: "Học sinh", x: 200, y: 200, h: 72, foot: [34, 16], patrol: [[200, 200], [590, 200]], speed: 60, lines: ["Sàn bên kia trơn lắm, tớ suýt ngã!"] },
        { id: "s2", img: "npc_student_b", name: "Học sinh", x: 100, y: 622, h: 72, foot: [34, 16], patrol: [[100, 622], [1320, 622]], speed: 70, lines: ["Tránh ra tránh ra, tớ đi nộp sổ đầu bài!"] },
        { id: "s3", img: "npc_student_a", name: "Học sinh", x: 1300, y: 712, h: 72, foot: [34, 16], patrol: [[1300, 712], [420, 712]], speed: 55, lines: ["Minh, cậu chạy đi đâu vậy?"] },
        { id: "s4", img: "npc_student_b", name: "Học sinh", x: 420, y: 915, h: 72, foot: [34, 16], patrol: [[420, 915], [1100, 915]], speed: 50, lines: ["Lối giữa là đường tắt lên hành lang trên đấy!"] },
        { id: "s5", img: "npc_student_a", name: "Học sinh", x: 1100, y: 205, h: 72, foot: [34, 16], patrol: [[1100, 205], [1340, 205]], speed: 45, lines: ["WC cuối hành lang vẫn mở đấy."] },
      ],
      things: [],
    },
  ];
})();
