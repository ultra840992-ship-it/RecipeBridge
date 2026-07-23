# filepath: live_server.py
import sentry_sdk
from flask import Flask, request, jsonify
import os

# Sentry 초기화
# DSN은 환경 변수 'SENTRY_DSN'에서 로드하거나 기본값을 사용.
# 실제 운영 환경에서는 반드시 SENTRY_DSN 환경 변수를 설정해야 함.
sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN", "https://examplePublicKey@o0.ingest.sentry.io/0"), # 실제 DSN으로 교체 필요
    traces_sample_rate=1.0,
    environment=os.environ.get("FLASK_ENV", "development") # 개발/운영 환경 구분
)

app = Flask(__name__)

@app.route('/api/payment', methods=['POST'])
def handle_payment():
    try:
        data = request.json
        if not data:
            raise ValueError("요청 본문이 비어있습니다.")
        
        user_id = data.get('user_id')
        amount = data.get('amount')

        if not user_id or not isinstance(user_id, str):
            raise ValueError("유효하지 않은 'user_id'입니다.")
        if not amount or not isinstance(amount, (int, float)) or amount <= 0:
            raise ValueError("유효하지 않은 'amount'입니다. 0보다 큰 숫자를 입력하세요.")

        # 실제 결제 처리 로직 (DB 연동, 외부 PG사 연동 등)
        # 예: payment_service.process_payment(user_id, amount)
        # 문제가 발생하면 특정 예외를 발생시키도록 구현

        print(f"결제 처리: 사용자 {user_id}, 금액 {amount}")
        return jsonify({"status": "success", "message": "결제가 성공적으로 처리되었습니다."}), 200

    except ValueError as e:
        sentry_sdk.capture_exception(e) # 비즈니스 로직 관련 유효성 검사 실패
        return jsonify({"status": "error", "message": str(e)}), 400
    except Exception as e:
        sentry_sdk.capture_exception(e) # 예상치 못한 서버 내부 오류
        return jsonify({"status": "error", "message": "결제 처리 중 내부 서버 오류가 발생했습니다."}), 500

@app.route('/api/match', methods=['POST'])
def handle_matching():
    try:
        data = request.json
        if not data:
            raise ValueError("요청 본문이 비어있습니다.")

        job_seeker_id = data.get('job_seeker_id')
        job_id = data.get('job_id')

        if not job_seeker_id or not isinstance(job_seeker_id, str):
            raise ValueError("유효하지 않은 'job_seeker_id'입니다.")
        if not job_id or not isinstance(job_id, str):
            raise ValueError("유효하지 않은 'job_id'입니다.")

        # 실제 매칭 처리 로직 (DB 연동, 매칭 알고리즘 실행 등)
        # 예: matching_service.execute_matching(job_seeker_id, job_id)
        # 매칭 실패 시 특정 예외를 발생시키도록 구현

        # 예시: 특정 조건에서 매칭 실패 시 Custom Exception 발생
        if job_seeker_id == "invalid_seeker_profile":
            raise PermissionError("구직자 프로필이 유효하지 않아 매칭할 수 없습니다.")

        print(f"매칭 처리: 구직자 {job_seeker_id}, 공고 {job_id}")
        return jsonify({"status": "success", "message": "매칭이 성공적으로 처리되었습니다."}), 200

    except ValueError as e:
        sentry_sdk.capture_exception(e) # 비즈니스 로직 관련 유효성 검사 실패
        return jsonify({"status": "error", "message": str(e)}), 400
    except PermissionError as e:
        sentry_sdk.capture_exception(e) # 권한 관련 오류
        return jsonify({"status": "error", "message": str(e)}), 403
    except Exception as e:
        sentry_sdk.capture_exception(e) # 예상치 못한 서버 내부 오류
        return jsonify({"status": "error", "message": "매칭 처리 중 내부 서버 오류가 발생했습니다."}), 500

if __name__ == '__main__':
    # 운영 환경에서는 debug=False로 설정하고 WSGI 서버(Gunicorn 등) 사용 권장
    app.run(debug=os.environ.get("FLASK_ENV") == "development", host='0.0.0.0', port=5000)
