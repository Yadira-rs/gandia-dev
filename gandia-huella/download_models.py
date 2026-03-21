from torchvision.models._api import WeightsEnum
_orig = WeightsEnum.get_state_dict
def _patched(self, *a, **kw):
    kw['check_hash'] = False
    return _orig(self, *a, **kw)
WeightsEnum.get_state_dict = _patched
from torchvision.models import efficientnet_b4, EfficientNet_B4_Weights
efficientnet_b4(weights=EfficientNet_B4_Weights.IMAGENET1K_V1)
print('EfficientNetB4 cached OK')