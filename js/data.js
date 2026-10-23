// All player-facing content for ĐẠI NẠN TRƯỚC GIỜ HỌC (Vietnamese).
// Coordinates are world pixels (1536x1024), y = feet / bottom of the sprite.
// Penalties: 0 none, 3 minor, 5 moderate, 8 major. No scoring of any kind.
(function () {

  // -------- toilet status words (one visual language on every map)
  const WC_TAG = {
    ok: "DÙNG ĐƯỢC", locked: "KHÓA", maint: "ĐANG SỬA", queue: "ĐANG CÓ NGƯỜI", need_key: "CẦN CHÌA KHÓA", need_paper: "CẦN BÁC BẢO VỆ",
  };

  const MAPS = window.MAPS_DEF;

  // ======================================================== DIALOGUE CHALLENGES
  // effect: flag set on the stage. pen: seconds lost. Each resolves once per attempt.
  const TALKS = {
    vendor: {
      text: "Em ơi, đi đường cẩn thận nhé! Chỗ này cô đang bày hàng, thùng chắn hết lối rồi. Em có muốn đi qua không?",
      choices: [
        { t: "Dạ, cô cho em đi qua một chút được không ạ? Em đang gấp lắm.", pen: 0, set: ["boxesOpen"],
          r: "Ừ, gấp thì nói sớm! Đây, cô dịch thùng cam sang một bên cho em qua. Chạy đi!" },
        { t: "Dạ cháu chào cô! Cam hôm nay ngọt không ạ? Bán bao nhiêu một cân ạ?", pen: 3, set: ["boxesOpen"],
          r: "Ngọt lắm, 30 nghìn... mà em hỏi làm gì, mặt tái mét kia? Thôi đi qua đi! (Lịch sự nhưng mất thời gian tán gẫu.)" },
        { t: "Để em tự bê mấy thùng này sang một bên nhé!", pen: 5, set: ["boxesOpen"],
          r: "Ấy ấy, từ từ! ... Rầm! Cam lăn khắp vỉa hè. Hai cô cháu nhặt mãi mới xong." },
        { t: "Thôi, em đi đường khác vậy ạ.", pen: 0,
          r: "Ừ, đi xuống đường rồi rẽ vào cái hẻm nhỏ là ra cuối phố nhanh. Mà khẽ thôi, có con chó đang ngủ!" },
      ],
      after: "Chạy cẩn thận nhé em!",
    },
    dog: {
      name: "Chú chó Mực", img: "dog_sleep",
      text: "Khò... khò... Một chú chó nằm ngủ chắn ngang con hẻm hẹp. Không có chỗ để lách qua.",
      choices: [
        { t: "Rón rén, khẽ gọi \"Mực ơi, nhích chút nào\" rồi xoa đầu nó.", pen: 0, set: ["dogMoved"],
          r: "Mực hé một mắt, ngáp dài, rồi lăn sang bên. Hẻm thông rồi!" },
        { t: "Hét thật to cho nó dậy: \"ĐI RAAA!\"", pen: 5, set: ["dogMoved"],
          r: "GÂU GÂU GÂU! Mực bật dậy đuổi Minh chạy vòng vòng một lúc rồi mới chịu bỏ đi." },
        { t: "Thôi để nó ngủ, mình đi lối khác.", pen: 0,
          r: "Minh lùi lại. Vẫn còn lối khác: đi hết đường lớn rồi lên ở cuối phố, hoặc hỏi cô bán hàng." },
      ],
      after: "Mực đã chuyển chỗ ngủ. Khò khò...",
    },
    mover: {
      text: "Em ơi, anh đang bê đồ chuyển nhà, nặng quá. Em giúp anh một tay được không?",
      choices: [
        { t: "Em đang vội, nhưng để em gọi người gần đây giúp anh nhé. Chú ơi, giúp anh này một tay với!", pen: 0,
          r: "Chú bên cạnh chạy ra đỡ ngay. \"Cảm ơn em, đi đi kẻo muộn!\"" },
        { t: "Không liên quan đến em, tự làm đi.", pen: 5,
          r: "\"Ơ cái thằng này, nói thế mà nghe được à?!\" Anh ấy chặn lại giảng giải một hồi..." },
        { t: "Vâng ạ, em sẽ giúp ngay!", pen: 8,
          r: "Minh bê hết thùng này đến thùng khác lên tận tầng ba. Anh ấy cảm ơn rối rít, nhưng bụng Minh thì không cảm ơn chút nào." },
      ],
      after: "Cảm ơn em nhé!",
    },
    shopper: {
      text: "Ối giời ơi! Túi rách mất rồi! Cam, cà chua lăn hết ra lối đi... Cháu ơi!",
      choices: [
        { t: "Dạ, cháu nhặt nhanh giúp bà mấy quả lăn ra giữa lối đi nhé!", pen: 0, set: ["spillOpen", "toldPassage"],
          r: "Nhanh tay ghê! Cảm ơn cháu. WC hả? Lối hẹp cạnh sạp cá đằng kia, cái cửa xanh lá còn trống đấy!" },
        { t: "Cô bán rau ơi, giúp bà một tay với ạ! Cháu đang gấp quá.", pen: 0, set: ["spillOpen", "toldPassage"],
          r: "Cô bán rau chạy ra phụ ngay. Bà Năm: \"Cảm ơn cháu đã gọi người! Đi lối hẹp cạnh sạp cá ấy, WC trong đó trống.\"" },
        { t: "Cháu nhặt hết, lau sạch từng quả rồi xếp lại túi thật gọn cho bà ạ.", pen: 5, set: ["spillOpen", "toldPassage"],
          r: "Bà cảm động lắm... nhưng Minh lau đến quả cà chua thứ mười hai thì bụng bắt đầu biểu tình. Tốt bụng nhưng sai thời điểm." },
        { t: "Cháu bước qua luôn cho nhanh.", pen: 3, set: ["spillOpen"],
          r: "Bẹp! Giẫm trúng quả cà chua, trượt chân suýt ngã. Phải xin lỗi rối rít rồi mới đi tiếp được." },
      ],
      after: "Cẩn thận nhé cháu!",
    },
    fishvendor: {
      text: "Nhà vệ sinh hả? Ờ... đi thẳng, rẽ trái, à không, rẽ phải... chỗ có cái thúng to to ấy... hay là cái thúng nhỏ nhỉ?",
      choices: [
        { t: "Dạ, ý cô là cái WC cửa xanh lá sau lối hẹp cạnh sạp cá, bên phải ạ?", pen: 0, set: ["toldPassage"],
          r: "Đúng rồi! Sau sạp cá có lối hẹp, chui qua là tới. Cái có hàng người xếp thì đừng chờ, lâu lắm!" },
        { t: "Dạ vâng ạ! (chạy đi luôn dù chưa hiểu gì)", pen: 3,
          r: "Minh chạy vòng vòng giữa sạp rau và sạp vải... rồi quay lại. Cô bán cá hét theo: \"Bên PHẢI, sau sạp CÁ!\"", set: ["toldPassage"] },
        { t: "Cô nói nhanh lên, cháu sắp không chịu nổi rồi!", pen: 3,
          r: "\"Ơ hay, cô đang nói đây thôi!\" Cô bối rối kể lại từ đầu, lần này còn chậm hơn. Cuối cùng: \"Lối hẹp cạnh sạp cá!\"", set: ["toldPassage"] },
      ],
      after: "Lối hẹp cạnh sạp cá ấy!",
    },
    queue: {
      name: "Bác đầu hàng", img: "queue",
      text: "Cháu định chen hàng à? Cả bốn người ở đây ai cũng đang gấp đấy!",
      choices: [
        { t: "Dạ không ạ. Cho cháu hỏi còn WC nào khác gần đây không ạ?", pen: 0, set: ["toldPassage"],
          r: "\"Có đấy, sau lối hẹp cạnh sạp cá bên phải. Ít người biết lắm.\"" },
        { t: "Cháu đau bụng nhất ở đây, cho cháu lên đầu đi!", pen: 3,
          r: "Cả hàng đồng thanh: \"AI CŨNG ĐAU!\" Một bác giảng cho Minh bài học về văn hóa xếp hàng." },
        { t: "Dạ cháu xếp hàng đợi ạ.", pen: 0,
          r: "Hàng không nhúc nhích chút nào. Có lẽ nên tìm WC khác thôi..." },
      ],
      after: "Xếp hàng đi cháu!",
    },
    gardener: {
      text: "Này cháu! Lối chính đang chặn vì cô vừa tưới và phun thuốc, bùn lầy trơn lắm, không qua được đâu!",
      choices: [
        { t: "Dạ, cô ơi có lối nào khác ra nhà vệ sinh gần nhất không ạ?", pen: 0, set: ["toldSide", "gotKey"],
          r: "Có! Đi lối đá phía trên, vòng sau hồ. Cái WC cửa xanh dương trên đó cô giữ chìa, đây, cầm lấy, mở là dùng được!" },
        { t: "Dạ, cháu đứng đây đợi cô làm xong ạ.", pen: 5, set: ["toldSide"],
          r: "Cô làm thêm mười phút nữa... \"Ơ, cháu đợi làm gì? Đường này chặn cả sáng mà! Đi lối đá phía trên kìa.\"" },
        { t: "Kệ, cháu chui qua dây chạy nhanh là được!", pen: 8, set: ["toldSide"],
          r: "Minh vừa chui qua dây đã trượt bùn ngã oạch. Cô làm vườn kéo dậy, xịt nước rửa chân... Vẫn phải quay lại!" },
      ],
      after: "Lối đá phía trên, vòng sau hồ nhé!",
    },
    child: {
      text: "Anh ơi! Quả bóng của em lăn tới chân anh rồi! Anh đá trả em với... hay anh chơi với em một ván nhé?",
      choices: [
        { t: "Đá nhẹ trả bóng cho em rồi đi tiếp.", pen: 0, r: "Bé Bin bắt được bóng, cười toe: \"Anh giỏi quá!\"" },
        { t: "Ừ, anh chơi với em một ván!", pen: 8, r: "Một ván thành ba ván. Bé Bin vui lắm. Bụng Minh thì không vui chút nào." },
        { t: "Xin lỗi em, anh đang vội lắm.", pen: 0, r: "\"Dạ...\" Bé Bin tự chạy ra nhặt bóng. Không sao cả." },
      ],
      after: "Anh chạy nhanh lên!",
    },
    guard: {
      text: "Này cháu! Chạy đi đâu mà vội thế? Nhà vệ sinh nhà xe chỉ mở khi có bác cho phép. Cháu có lý do gì không?",
      choices: [
        { t: "Dạ cháu là Minh lớp 10A3. Cháu đau bụng quá, WC trong sân đang sửa. Bác cho cháu dùng WC nhà xe được không ạ?", pen: 0, set: ["guardOk"],
          r: "Nói rõ ràng thế là được! Đây, bác mở cửa cho. Vào nhanh rồi lên lớp nhé." },
        { t: "Dạ... thầy hiệu trưởng gọi cháu vào nhà xe gấp ạ!", pen: 8, set: ["guardOk"],
          r: "\"Thế à? Để bác gọi điện hỏi thầy...\" Tút... tút... \"Thầy bảo không gọi ai cả!\" Bác giảng một hồi về nói thật rồi mới mở cửa." },
        { t: "Bác hỏi nhiều quá, cho cháu qua đi!", pen: 5, set: ["guardOk"],
          r: "\"Ăn nói thế à? Đưa thẻ học sinh đây!\" Kiểm tra thẻ, ghi sổ xong xuôi bác mới mở cửa." },
        { t: "(Không nói gì, chỉ ôm bụng và chỉ vào nhà xe)", pen: 3, set: ["guardOk"],
          r: "\"Cháu bị sao? Đau bụng à? Đau thì phải nói chứ!\" Hỏi han một lúc bác mới hiểu và mở cửa." },
      ],
      after: "Vào nhanh rồi lên lớp nhé!",
    },
    friend: {
      text: "Minh ơi! Cho tớ mượn vở bài tập Toán chép tí, hai phút thôi! Làm ơn!",
      choices: [
        { t: "Giờ tớ đang gấp thật, ra chơi tớ giảng cho cậu bài đó nhé!", pen: 0, r: "\"Ờ... ok, ra chơi nhé. Đi nhanh đi, mặt cậu xanh lè kìa!\"" },
        { t: "Ừ, đợi tớ lục cặp tìm vở cho cậu.", pen: 5, r: "Lục mãi... vở Văn, vở Sử, hộp bút, nửa cái bánh mì... cuối cùng mới thấy vở Toán." },
        { t: "Không cho! Chép bài là không tốt đâu.", pen: 0, r: "\"Ờ thì thôi...\" Hùng hơi phụng phịu nhưng cũng tránh đường cho Minh." },
      ],
      after: "Ra chơi nhớ đấy!",
    },
    cleaner: {
      text: "Đứng lại em ơi! Cô vừa lau, sàn hành lang này đang trơn lắm. Em đi lối giữa bên kia cho an toàn nhé.",
      choices: [
        { t: "Dạ vâng ạ, em đi lối giữa ạ.", pen: 0,
          r: "Ngoan! Lối giữa ở hành lang dưới, cạnh lớp 10A4. Đi lên là tới cuối hành lang trên." },
        { t: "Em đi nhẹ thôi, không sao đâu cô!", pen: 8, slip: true,
          r: "Bước thứ hai... XOẸT! Minh trượt một vòng, ngã chổng vó. Cô lao công đỡ dậy: \"Đã bảo rồi mà!\" Vẫn phải đi đường khác." },
        { t: "Cô ơi, có lối nào nhanh mà vẫn an toàn không ạ? Em gấp lắm.", pen: 0, set: ["dryStrip"],
          r: "Có! Cô kéo xô sang. Đi sát mép tường phía dưới, dải đó cô chưa lau, còn khô. Đi từ từ nhé!" },
      ],
      after: "Đi từ từ thôi em!",
    },
    teacher: {
      text: "Này em kia! Giờ này còn chạy lung tung ngoài hành lang à? Em đi đâu đấy?",
      choices: [
        { t: "Dạ em xin lỗi cô. Em đau bụng, em đi vệ sinh rồi vào lớp ngay ạ.", pen: 0,
          r: "\"Ừ, thế thì đi nhanh. WC dùng được ở cuối hành lang trên, đi qua lối giữa là gần nhất.\"" },
        { t: "Dạ... em đi lấy phấn cho cô chủ nhiệm ạ.", pen: 5,
          r: "\"Phấn à? Phòng đồ dùng ở đây, cô dẫn em đi.\" ... Đi được nửa đường Minh đành thú thật. Mất bao nhiêu thời gian!" },
        { t: "(Chạy luôn, giả vờ không nghe thấy)", pen: 3,
          r: "\"ĐỨNG LẠI!\" Cô gọi giật lại, ghi tên vào sổ rồi mới cho đi." },
      ],
      after: "Đi nhanh rồi vào lớp!",
    },
  };

  // ======================================================== FINAL CHALLENGE
  const FINAL_EVENTS = [
    { id: "knock", at: 20, moment: "knock", name: "Ai đó ngoài cửa",
      text: "CỐC CỐC CỐC! \"Có ai trong đó không? Nhanh lên!\"",
      choices: [
        { t: "\"Dạ có người ạ! Em ra ngay, chờ em chút nhé!\"", dp: 0, pen: 0, r: "\"Ừ, thế thì chờ.\" Tiếng bước chân đi xa. Yên tĩnh trở lại." },
        { t: "(Im lặng, nín thở)", dp: -10, pen: 0, r: "CỐC CỐC CỐC CỐC! Gõ to hơn, lâu hơn. Minh giật mình, mất hết tập trung." },
        { t: "\"ĐI CHỖ KHÁC ĐI!!!\"", dp: -5, pen: 5, r: "\"Ăn nói thế à?!\" Hai bên cãi nhau qua cánh cửa một lúc lâu..." },
      ] },
    { id: "phone", at: 42, moment: "phone", name: "Điện thoại",
      text: "Bzzz bzzz! Mẹ: \"Con đến lớp chưa?\" Kèm theo 37 tin nhắn mới trong nhóm lớp.",
      choices: [
        { t: "Nhắn nhanh \"Con tới trường rồi ạ\" rồi tắt tiếng.", dp: 0, pen: 0, r: "Mẹ thả tim. Điện thoại im lặng. Tuyệt vời." },
        { t: "Lướt đọc hết 37 tin nhắn nhóm lớp.", dp: 0, pen: 5, r: "36 tin là ảnh mèo và sticker. 1 tin là \"Hôm nay kiểm tra 15 phút\". Mất thời gian ghê." },
        { t: "Xem \"một tí\" video mèo bạn vừa gửi.", dp: -5, pen: 8, r: "Một video thành mười video. Mèo dễ thương thật... nhưng đồng hồ vẫn chạy!" },
      ] },
    { id: "ask", at: 64, moment: "ask", name: "Giọng ngoài cửa",
      text: "\"Ê, ai trong đó đấy? Bài tập Toán câu 3 đáp án là bao nhiêu thế?\"",
      choices: [
        { t: "\"Minh đây! Lát ra tớ chỉ cho, giờ đang bận!\"", dp: 0, pen: 0, r: "\"Ok, lát nhé!\" Đơn giản vậy thôi." },
        { t: "Giải thích chi tiết câu 3 qua khe cửa.", dp: 0, pen: 5, r: "\"... rồi chia hai vế cho x, nhớ đổi dấu...\" Người ngoài cửa hiểu bài. Thời gian thì mất." },
        { t: "Giả vờ không nghe thấy.", dp: -10, pen: 0, r: "\"MINH ƠI! CÂU BA! CÂU BAAA!\" Càng lúc càng to. Không thể tập trung nổi." },
      ] },
    { id: "lights", at: 84, moment: "lights", name: "Sự cố bất ngờ",
      text: "Phụt! Đèn tắt tối om. Rồi... RENGGG! Chuông vào lớp reo inh ỏi!",
      choices: [
        { t: "Hít thở sâu, bình tĩnh, bật đèn pin điện thoại.", dp: 5, pen: 0, r: "Bình tĩnh là sức mạnh. Đèn pin bật lên, mọi thứ lại ổn." },
        { t: "Hét toáng: \"CỨU! MẤT ĐIỆN!\"", dp: -10, pen: 3, r: "Cả dãy nhà nghe thấy. Bác bảo vệ chạy tới hỏi han. Xấu hổ quá..." },
        { t: "Lao ra ngoài xem có chuyện gì.", dp: -15, pen: 3, r: "Ra đến cửa mới nhớ ra mình chưa xong. Quay vào thôi..." },
      ] },
  ];

  const ENDING = [
    { img: "end1", say: "Phùùù... Nhẹ cả người! Thế giới thật tươi đẹp!" },
    { img: "end2", say: "Chết rồi! 7 giờ 45 rồi!!!", speed: true },
    { img: "end3", say: "Thầy ơi, thầy điểm danh cho em với ạ! Em có lý do chính đáng mà!" },
    { img: "end4", say: "KHÔNG ĐƯỢC! Em đến muộn 45 phút rồi.", shout: true },
    { stamp: "CẤM THI", note: "Môn Sinh học: Không đủ điều kiện dự thi.\nKết quả: TRƯỢT MÔN. (Hư cấu cho vui thôi nhé!)" },
    { img: "end6", wide: true, say: "Bố mẹ: \"Thôi, con về quê cấy lúa với bố mẹ!\"", say2: "Minh: \"Ít ra ở quê... nhà vệ sinh không bao giờ khóa.\"" },
  ];

  const FAIL_LINES = [
    "Minh đứng hình. Cả khu phố bỗng trở nên rất, rất yên lặng.",
    "Giữa chợ đông người, Minh quyết định... đứng im như tượng.",
    "Cá chép dưới hồ nhìn Minh đầy thương cảm.",
    "Bác bảo vệ lắc đầu: \"Giá mà cháu nhanh hơn chút...\"",
    "Hành lang vắng tanh. Chỉ còn tiếng đồng hồ tích tắc.",
    "Chuông vào lớp reo. Cánh cửa vẫn đóng. Minh vẫn ở trong.",
  ];

  window.GAME_DATA = { MAPS, TALKS, FINAL_EVENTS, ENDING, FAIL_LINES, WC_TAG };
})();
